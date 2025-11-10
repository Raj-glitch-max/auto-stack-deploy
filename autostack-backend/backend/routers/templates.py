"""
API Router for Template Marketplace
UNIQUE FEATURE #4 - Production-Ready Templates
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from ..db import get_db
from ..auth import get_current_user
from .. import models
from ..services.template_service import template_service

router = APIRouter(prefix="/templates", tags=["templates"])


# ===== SCHEMAS =====

class TemplateResponse(BaseModel):
    """Template response"""
    id: str
    name: str
    description: str
    category: str
    tech_stack: List[str]
    icon: str
    tags: List[str]
    github_url: Optional[str]
    demo_url: Optional[str]
    usage_count: int
    rating: Optional[float]
    is_official: bool
    is_featured: bool


class DeployFromTemplateRequest(BaseModel):
    """Deploy from template request"""
    project_name: str
    template_id: str


# ===== ENDPOINTS =====

@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user)
):
    """List all templates"""
    templates = await template_service.get_all_templates(category)
    return [TemplateResponse(**t) for t in templates]


@router.get("/featured", response_model=List[TemplateResponse])
async def get_featured_templates(
    current_user: models.User = Depends(get_current_user)
):
    """Get featured templates"""
    templates = await template_service.get_featured_templates()
    return [TemplateResponse(**t) for t in templates]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Get template details"""
    template = await template_service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse(**template)


@router.post("/deploy", status_code=status.HTTP_201_CREATED)
async def deploy_from_template(
    deploy_data: DeployFromTemplateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Deploy a project from a template"""
    result = await template_service.deploy_from_template(
        deploy_data.template_id,
        deploy_data.project_name,
        current_user.id
    )
    
    if not result.get('success'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get('error', 'Failed to deploy template')
        )
    
    return result
