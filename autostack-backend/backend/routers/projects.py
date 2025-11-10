"""
API Router for Projects, Environment Variables, Domains
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..db import get_db
from ..auth import get_current_user
from .. import models
from ..schemas_projects import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    EnvVarCreate, EnvVarUpdate, EnvVarResponse, EnvVarListResponse,
    DomainCreate, DomainResponse, DomainListResponse, DomainVerifyRequest,
    DeploymentCreateFromProject, DeploymentResponseEnhanced
)
from ..crud_projects import (
    create_project, get_project, list_user_projects, update_project, delete_project, archive_project,
    create_env_var, list_env_vars, update_env_var, delete_env_var,
    add_domain, list_domains, verify_domain, delete_domain
)

router = APIRouter(prefix="/projects", tags=["projects"])


# ===== PROJECT ENDPOINTS =====

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_new_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new project"""
    try:
        project = await create_project(db, current_user, project_data)
        
        # Convert to response model
        response = ProjectResponse.model_validate(project)
        response.deployment_count = 0
        response.last_deployment = None
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get("", response_model=ProjectListResponse)
async def get_user_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all projects for the current user"""
    projects, total = await list_user_projects(
        db, current_user.id, skip, limit, include_archived
    )
    
    # Convert to response models
    project_responses = []
    for project in projects:
        response = ProjectResponse.model_validate(project)
        # TODO: Add deployment count and last deployment
        response.deployment_count = 0
        response.last_deployment = None
        project_responses.append(response)
    
    return ProjectListResponse(
        projects=project_responses,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_by_id(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific project"""
    project = await get_project(db, project_id, current_user.id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    response = ProjectResponse.model_validate(project)
    # TODO: Add deployment count and last deployment
    response.deployment_count = 0
    response.last_deployment = None
    
    return response


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project_by_id(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a project"""
    project = await update_project(db, project_id, current_user.id, project_data)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    response = ProjectResponse.model_validate(project)
    response.deployment_count = 0
    response.last_deployment = None
    
    return response


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_by_id(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a project"""
    success = await delete_project(db, project_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return None


@router.post("/{project_id}/archive", response_model=ProjectResponse)
async def archive_project_by_id(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Archive a project"""
    project = await archive_project(db, project_id, current_user.id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    response = ProjectResponse.model_validate(project)
    response.deployment_count = 0
    response.last_deployment = None
    
    return response


# ===== ENVIRONMENT VARIABLE ENDPOINTS =====

@router.post("/{project_id}/env-vars", response_model=EnvVarResponse, status_code=status.HTTP_201_CREATED)
async def create_environment_variable(
    project_id: str,
    env_var_data: EnvVarCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add an environment variable to a project"""
    env_var = await create_env_var(db, project_id, current_user.id, env_var_data)
    
    if not env_var:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create environment variable. It may already exist or project not found."
        )
    
    return EnvVarResponse.model_validate(env_var)


@router.get("/{project_id}/env-vars", response_model=EnvVarListResponse)
async def get_environment_variables(
    project_id: str,
    environment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List environment variables for a project"""
    env_vars = await list_env_vars(db, project_id, current_user.id, environment)
    
    # Mask sensitive values
    env_var_responses = []
    for env_var in env_vars:
        response = EnvVarResponse.model_validate(env_var)
        if env_var.is_sensitive:
            response.value = "***SENSITIVE***"
        env_var_responses.append(response)
    
    return EnvVarListResponse(
        variables=env_var_responses,
        total=len(env_var_responses)
    )


@router.put("/{project_id}/env-vars/{env_var_id}", response_model=EnvVarResponse)
async def update_environment_variable(
    project_id: str,
    env_var_id: str,
    env_var_data: EnvVarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an environment variable"""
    env_var = await update_env_var(db, env_var_id, project_id, current_user.id, env_var_data)
    
    if not env_var:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment variable not found"
        )
    
    response = EnvVarResponse.model_validate(env_var)
    if env_var.is_sensitive:
        response.value = "***SENSITIVE***"
    
    return response


@router.delete("/{project_id}/env-vars/{env_var_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_environment_variable(
    project_id: str,
    env_var_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an environment variable"""
    success = await delete_env_var(db, env_var_id, project_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment variable not found"
        )
    
    return None


# ===== DOMAIN ENDPOINTS =====

@router.post("/{project_id}/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
async def add_custom_domain(
    project_id: str,
    domain_data: DomainCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a custom domain to a project"""
    domain = await add_domain(db, project_id, current_user.id, domain_data)
    
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add domain. It may already be in use or project not found."
        )
    
    return DomainResponse.model_validate(domain)


@router.get("/{project_id}/domains", response_model=DomainListResponse)
async def get_project_domains(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List domains for a project"""
    domains = await list_domains(db, project_id, current_user.id)
    
    domain_responses = [DomainResponse.model_validate(d) for d in domains]
    
    return DomainListResponse(
        domains=domain_responses,
        total=len(domain_responses)
    )


@router.post("/{project_id}/domains/{domain_id}/verify", response_model=DomainResponse)
async def verify_custom_domain(
    project_id: str,
    domain_id: str,
    verify_data: DomainVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Verify domain ownership"""
    domain = await verify_domain(db, domain_id, project_id, current_user.id)
    
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    return DomainResponse.model_validate(domain)


@router.delete("/{project_id}/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_custom_domain(
    project_id: str,
    domain_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a custom domain"""
    success = await delete_domain(db, domain_id, project_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    return None


# ===== DEPLOYMENT ENDPOINTS (Project-based) =====

@router.post("/{project_id}/deployments", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def deploy_project(
    project_id: str,
    deploy_data: Optional[DeploymentCreateFromProject] = None,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deploy a project
    Creates a new deployment using the project's configuration
    """
    project = await get_project(db, project_id, current_user.id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Use project's default branch if not specified
    branch = deploy_data.branch if deploy_data else project.default_branch
    environment = deploy_data.environment if deploy_data else "production"
    is_production = deploy_data.is_production if deploy_data else True
    
    # TODO: Create deployment and trigger build
    # This will integrate with the existing deployment system
    
    return {
        "message": "Deployment queued",
        "project_id": project_id,
        "branch": branch,
        "environment": environment
    }


@router.get("/{project_id}/deployments", response_model=List[DeploymentResponseEnhanced])
async def get_project_deployments(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List deployments for a project"""
    project = await get_project(db, project_id, current_user.id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # TODO: Query deployments for this project
    # This will integrate with existing deployment queries
    
    return []
