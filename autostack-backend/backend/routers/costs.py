"""
API Router for Cost Tracking and Optimization
UNIQUE FEATURE #1 - NO COMPETITOR HAS THIS!
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from ..db import get_db
from ..auth import get_current_user
from .. import models
from ..services.cost_service import cost_service
from ..ml.cost_predictor import cost_predictor
from ..services.budget_service import budget_service

router = APIRouter(prefix="/costs", tags=["costs"])


# ===== SCHEMAS =====

class CostSnapshotResponse(BaseModel):
    """Cost snapshot response"""
    id: str
    project_id: str
    timestamp: datetime
    total_cost: float
    compute_cost: float
    storage_cost: float
    bandwidth_cost: float
    database_cost: float
    other_cost: float
    cloud_provider: str
    region: Optional[str] = None
    breakdown: Optional[dict] = None
    
    class Config:
        from_attributes = True


class CostSummaryResponse(BaseModel):
    """Cost summary response"""
    total_cost: float
    average_cost: float
    min_cost: float
    max_cost: float
    trend: str
    data_points: int


class CostPredictionResponse(BaseModel):
    """Cost prediction response"""
    id: str
    predicted_daily_cost: float
    predicted_monthly_cost: float
    predicted_yearly_cost: float
    confidence_score: float
    model_version: str
    prediction_date: datetime
    days_of_data_used: int
    
    class Config:
        from_attributes = True


class BudgetAlertCreate(BaseModel):
    """Create budget alert"""
    project_id: str
    budget_limit: float = Field(..., gt=0)
    budget_period: str = Field(default='monthly')
    alert_threshold: float = Field(default=0.80, ge=0.0, le=1.0)
    auto_scale_down: bool = Field(default=False)
    auto_pause: bool = Field(default=False)
    notification_channels: Optional[dict] = None


class BudgetAlertResponse(BaseModel):
    """Budget alert response"""
    id: str
    project_id: str
    budget_limit: float
    budget_period: str
    alert_threshold: float
    current_spend: float
    is_exceeded: bool
    auto_scale_down: bool
    auto_pause: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class BudgetStatusResponse(BaseModel):
    """Budget status response"""
    budget_limit: float
    current_spend: float
    remaining: float
    percentage_used: float
    is_exceeded: bool
    alert_threshold: float
    budget_period: str
    status: str


class CostRecommendationResponse(BaseModel):
    """Cost recommendation response"""
    id: str
    recommendation_type: str
    title: str
    description: str
    impact: str
    estimated_monthly_savings: float
    estimated_yearly_savings: float
    savings_percentage: float
    implementation_effort: str
    can_auto_apply: bool
    status: str
    confidence_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class CostAnomalyResponse(BaseModel):
    """Cost anomaly response"""
    id: str
    anomaly_type: str
    severity: str
    description: str
    expected_cost: float
    actual_cost: float
    cost_difference: float
    percentage_increase: float
    detected_at: datetime
    status: str
    
    class Config:
        from_attributes = True


# ===== COST SNAPSHOT ENDPOINTS =====

@router.get("/projects/{project_id}/snapshots", response_model=List[CostSnapshotResponse])
async def get_project_cost_snapshots(
    project_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get cost snapshots for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    snapshots = await cost_service.get_project_costs(db, project_id, start_date, end_date)
    return [CostSnapshotResponse.model_validate(s) for s in snapshots]


@router.get("/projects/{project_id}/summary", response_model=CostSummaryResponse)
async def get_project_cost_summary(
    project_id: str,
    period: str = Query('today', regex='^(today|week|month)$'),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get cost summary for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    summary = await cost_service.calculate_cost_summary(db, project_id, period)
    return CostSummaryResponse(**summary)


# ===== COST PREDICTION ENDPOINTS =====

@router.post("/projects/{project_id}/predict", response_model=CostPredictionResponse)
async def predict_project_costs(
    project_id: str,
    days_ahead: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate cost prediction for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    prediction = await cost_predictor.predict_costs(db, project_id, current_user.id, days_ahead)
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate prediction"
        )
    
    return CostPredictionResponse.model_validate(prediction)


@router.get("/projects/{project_id}/prediction", response_model=CostPredictionResponse)
async def get_latest_prediction(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get latest cost prediction for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    prediction = await cost_predictor.get_latest_prediction(db, project_id)
    
    if not prediction:
        # Generate new prediction if none exists
        prediction = await cost_predictor.predict_costs(db, project_id, current_user.id)
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction available"
        )
    
    return CostPredictionResponse.model_validate(prediction)


# ===== BUDGET ALERT ENDPOINTS =====

@router.post("/budget-alerts", response_model=BudgetAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_alert(
    alert_data: BudgetAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a budget alert"""
    # Verify project ownership
    project = await db.get(models.Project, alert_data.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    alert = await budget_service.create_budget_alert(
        db,
        alert_data.project_id,
        current_user.id,
        alert_data.budget_limit,
        alert_data.budget_period,
        alert_data.alert_threshold,
        alert_data.auto_scale_down,
        alert_data.auto_pause,
        alert_data.notification_channels
    )
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create budget alert"
        )
    
    return BudgetAlertResponse.model_validate(alert)


@router.get("/projects/{project_id}/budget-status", response_model=BudgetStatusResponse)
async def get_budget_status(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get budget status for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    status_data = await budget_service.get_budget_status(db, project_id)
    
    if not status_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No budget alert configured for this project"
        )
    
    return BudgetStatusResponse(**status_data)


@router.get("/budget-alerts", response_model=List[BudgetAlertResponse])
async def list_budget_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all budget alerts for the current user"""
    alerts = await budget_service.list_budget_alerts(db, current_user.id)
    return [BudgetAlertResponse.model_validate(a) for a in alerts]


# ===== COST RECOMMENDATIONS ENDPOINTS =====

@router.post("/projects/{project_id}/recommendations", response_model=List[CostRecommendationResponse])
async def generate_cost_recommendations(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate cost optimization recommendations"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    recommendations = await cost_service.generate_cost_recommendations(db, project_id, current_user.id)
    return [CostRecommendationResponse.model_validate(r) for r in recommendations]


# ===== COST ANOMALIES ENDPOINTS =====

@router.post("/projects/{project_id}/detect-anomalies", response_model=List[CostAnomalyResponse])
async def detect_cost_anomalies(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Detect cost anomalies for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    anomalies = await cost_service.detect_cost_anomalies(db, project_id, current_user.id)
    return [CostAnomalyResponse.model_validate(a) for a in anomalies]


# ===== DASHBOARD ENDPOINT =====

@router.get("/dashboard")
async def get_cost_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive cost dashboard data"""
    # Get all user's projects
    from sqlalchemy import select
    query = select(models.Project).where(models.Project.user_id == current_user.id)
    result = await db.execute(query)
    projects = list(result.scalars().all())
    
    dashboard_data = {
        'total_monthly_cost': 0.0,
        'total_predicted_monthly_cost': 0.0,
        'projects': [],
        'total_savings_potential': 0.0,
        'active_alerts': 0
    }
    
    for project in projects:
        # Get latest costs
        summary = await cost_service.calculate_cost_summary(db, project.id, 'month')
        
        # Get prediction
        prediction = await cost_predictor.get_latest_prediction(db, project.id)
        
        # Get budget status
        budget_status = await budget_service.get_budget_status(db, project.id)
        
        project_data = {
            'project_id': project.id,
            'project_name': project.name,
            'current_monthly_cost': summary.get('total_cost', 0.0),
            'predicted_monthly_cost': prediction.predicted_monthly_cost if prediction else 0.0,
            'trend': summary.get('trend', 'stable'),
            'budget_status': budget_status
        }
        
        dashboard_data['projects'].append(project_data)
        dashboard_data['total_monthly_cost'] += project_data['current_monthly_cost']
        dashboard_data['total_predicted_monthly_cost'] += project_data['predicted_monthly_cost']
        
        if budget_status and budget_status['status'] != 'ok':
            dashboard_data['active_alerts'] += 1
    
    return dashboard_data
