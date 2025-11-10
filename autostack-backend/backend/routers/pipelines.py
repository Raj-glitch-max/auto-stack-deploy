"""
API Router for Visual Pipeline Builder
UNIQUE FEATURE #2 - NO COMPETITOR HAS THIS!
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, Field

from ..db import get_db
from ..auth import get_current_user
from .. import models
from ..services.pipeline_service import pipeline_service

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


# ===== SCHEMAS =====

class PipelineNodeData(BaseModel):
    """Node data in pipeline"""
    label: str
    command: Optional[str] = None
    target: Optional[str] = None
    channel: Optional[str] = None


class PipelineNode(BaseModel):
    """Pipeline node"""
    id: str
    type: str
    position: dict
    data: PipelineNodeData


class PipelineEdge(BaseModel):
    """Pipeline edge"""
    id: str
    source: str
    target: str


class PipelineDefinition(BaseModel):
    """Pipeline visual definition"""
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]


class PipelineCreate(BaseModel):
    """Create pipeline request"""
    project_id: str
    name: str
    description: Optional[str] = None
    definition: PipelineDefinition
    trigger_type: str = Field(default='manual')
    trigger_config: Optional[dict] = None


class PipelineUpdate(BaseModel):
    """Update pipeline request"""
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[PipelineDefinition] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[dict] = None


class PipelineResponse(BaseModel):
    """Pipeline response"""
    id: str
    project_id: str
    name: str
    description: Optional[str]
    definition: dict
    version: int
    trigger_type: str
    is_active: bool
    created_at: str
    updated_at: str
    last_run_at: Optional[str]
    
    class Config:
        from_attributes = True


class PipelineRunResponse(BaseModel):
    """Pipeline run response"""
    id: str
    pipeline_id: str
    run_number: int
    status: str
    trigger_type: str
    triggered_by: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    error_message: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class PipelineStepResponse(BaseModel):
    """Pipeline step response"""
    id: str
    step_name: str
    step_type: str
    step_order: int
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    logs: Optional[str]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class ExecutePipelineRequest(BaseModel):
    """Execute pipeline request"""
    trigger_type: str = Field(default='manual')
    triggered_by: Optional[str] = None


# ===== PIPELINE ENDPOINTS =====

@router.post("", response_model=PipelineResponse, status_code=status.HTTP_201_CREATED)
async def create_pipeline(
    pipeline_data: PipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new visual pipeline"""
    # Verify project ownership
    project = await db.get(models.Project, pipeline_data.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    pipeline = await pipeline_service.create_pipeline(
        db,
        pipeline_data.project_id,
        current_user.id,
        pipeline_data.name,
        pipeline_data.definition.dict(),
        pipeline_data.description,
        pipeline_data.trigger_type,
        pipeline_data.trigger_config
    )
    
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create pipeline"
        )
    
    return PipelineResponse(
        id=pipeline.id,
        project_id=pipeline.project_id,
        name=pipeline.name,
        description=pipeline.description,
        definition=pipeline.definition,
        version=pipeline.version,
        trigger_type=pipeline.trigger_type,
        is_active=pipeline.is_active,
        created_at=pipeline.created_at.isoformat(),
        updated_at=pipeline.updated_at.isoformat(),
        last_run_at=pipeline.last_run_at.isoformat() if pipeline.last_run_at else None
    )


@router.get("/project/{project_id}", response_model=List[PipelineResponse])
async def list_project_pipelines(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all pipelines for a project"""
    # Verify project ownership
    project = await db.get(models.Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    from sqlalchemy import select
    query = select(models.Pipeline).where(
        models.Pipeline.project_id == project_id
    ).order_by(models.Pipeline.created_at.desc())
    
    result = await db.execute(query)
    pipelines = list(result.scalars().all())
    
    return [
        PipelineResponse(
            id=p.id,
            project_id=p.project_id,
            name=p.name,
            description=p.description,
            definition=p.definition,
            version=p.version,
            trigger_type=p.trigger_type,
            is_active=p.is_active,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
            last_run_at=p.last_run_at.isoformat() if p.last_run_at else None
        )
        for p in pipelines
    ]


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(
    pipeline_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get pipeline details"""
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    return PipelineResponse(
        id=pipeline.id,
        project_id=pipeline.project_id,
        name=pipeline.name,
        description=pipeline.description,
        definition=pipeline.definition,
        version=pipeline.version,
        trigger_type=pipeline.trigger_type,
        is_active=pipeline.is_active,
        created_at=pipeline.created_at.isoformat(),
        updated_at=pipeline.updated_at.isoformat(),
        last_run_at=pipeline.last_run_at.isoformat() if pipeline.last_run_at else None
    )


@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: str,
    pipeline_data: PipelineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a pipeline"""
    # Verify ownership
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    updated_pipeline = await pipeline_service.update_pipeline(
        db,
        pipeline_id,
        pipeline_data.definition.dict() if pipeline_data.definition else None,
        pipeline_data.name,
        pipeline_data.description,
        pipeline_data.trigger_type,
        pipeline_data.trigger_config
    )
    
    if not updated_pipeline:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update pipeline"
        )
    
    return PipelineResponse(
        id=updated_pipeline.id,
        project_id=updated_pipeline.project_id,
        name=updated_pipeline.name,
        description=updated_pipeline.description,
        definition=updated_pipeline.definition,
        version=updated_pipeline.version,
        trigger_type=updated_pipeline.trigger_type,
        is_active=updated_pipeline.is_active,
        created_at=updated_pipeline.created_at.isoformat(),
        updated_at=updated_pipeline.updated_at.isoformat(),
        last_run_at=updated_pipeline.last_run_at.isoformat() if updated_pipeline.last_run_at else None
    )


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pipeline(
    pipeline_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a pipeline"""
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    await db.delete(pipeline)
    await db.commit()


# ===== PIPELINE EXECUTION ENDPOINTS =====

@router.post("/{pipeline_id}/execute", response_model=PipelineRunResponse)
async def execute_pipeline(
    pipeline_id: str,
    execute_data: ExecutePipelineRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Execute a pipeline"""
    # Verify ownership
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    run = await pipeline_service.execute_pipeline(
        db,
        pipeline_id,
        current_user.id,
        execute_data.trigger_type,
        execute_data.triggered_by
    )
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute pipeline"
        )
    
    return PipelineRunResponse(
        id=run.id,
        pipeline_id=run.pipeline_id,
        run_number=run.run_number,
        status=run.status,
        trigger_type=run.trigger_type,
        triggered_by=run.triggered_by,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
        duration_seconds=run.duration_seconds,
        error_message=run.error_message,
        created_at=run.created_at.isoformat()
    )


@router.get("/{pipeline_id}/runs", response_model=List[PipelineRunResponse])
async def get_pipeline_runs(
    pipeline_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get pipeline run history"""
    # Verify ownership
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    runs = await pipeline_service.get_pipeline_runs(db, pipeline_id, limit)
    
    return [
        PipelineRunResponse(
            id=r.id,
            pipeline_id=r.pipeline_id,
            run_number=r.run_number,
            status=r.status,
            trigger_type=r.trigger_type,
            triggered_by=r.triggered_by,
            started_at=r.started_at.isoformat() if r.started_at else None,
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
            duration_seconds=r.duration_seconds,
            error_message=r.error_message,
            created_at=r.created_at.isoformat()
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get pipeline run details"""
    run = await db.get(models.PipelineRun, run_id)
    if not run or run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline run not found"
        )
    
    return PipelineRunResponse(
        id=run.id,
        pipeline_id=run.pipeline_id,
        run_number=run.run_number,
        status=run.status,
        trigger_type=run.trigger_type,
        triggered_by=run.triggered_by,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
        duration_seconds=run.duration_seconds,
        error_message=run.error_message,
        created_at=run.created_at.isoformat()
    )


@router.get("/runs/{run_id}/steps", response_model=List[PipelineStepResponse])
async def get_run_steps(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get steps for a pipeline run"""
    run = await db.get(models.PipelineRun, run_id)
    if not run or run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline run not found"
        )
    
    steps = await pipeline_service.get_run_steps(db, run_id)
    
    return [
        PipelineStepResponse(
            id=s.id,
            step_name=s.step_name,
            step_type=s.step_type,
            step_order=s.step_order,
            status=s.status,
            started_at=s.started_at.isoformat() if s.started_at else None,
            completed_at=s.completed_at.isoformat() if s.completed_at else None,
            duration_seconds=s.duration_seconds,
            logs=s.logs,
            error_message=s.error_message
        )
        for s in steps
    ]


@router.post("/runs/{run_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_pipeline_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Cancel a running pipeline"""
    run = await db.get(models.PipelineRun, run_id)
    if not run or run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline run not found"
        )
    
    success = await pipeline_service.cancel_run(db, run_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel pipeline run"
        )
    
    return {"message": "Pipeline run cancelled"}


# ===== YAML EXPORT =====

@router.get("/{pipeline_id}/export/yaml")
async def export_pipeline_yaml(
    pipeline_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Export pipeline to GitHub Actions YAML"""
    pipeline = await db.get(models.Pipeline, pipeline_id)
    if not pipeline or pipeline.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    
    yaml_content = await pipeline_service.export_to_yaml(db, pipeline_id)
    
    if not yaml_content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export pipeline"
        )
    
    return {"yaml": yaml_content}
