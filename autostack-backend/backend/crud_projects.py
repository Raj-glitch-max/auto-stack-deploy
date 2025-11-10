"""
CRUD operations for Projects, Environment Variables, Domains, and Teams
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
import re
from datetime import datetime

from . import models
from .schemas_projects import (
    ProjectCreate, ProjectUpdate,
    EnvVarCreate, EnvVarUpdate,
    DomainCreate,
    TeamCreate, TeamUpdate, TeamInviteRequest
)


# ===== HELPER FUNCTIONS =====

def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from project name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9-]', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug[:63]  # Kubernetes name limit


async def ensure_unique_slug(session: AsyncSession, user_id: str, base_slug: str) -> str:
    """Ensure slug is unique for the user"""
    slug = base_slug
    counter = 1
    
    while True:
        result = await session.execute(
            select(models.Project).where(
                and_(
                    models.Project.user_id == user_id,
                    models.Project.slug == slug
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            return slug
        
        slug = f"{base_slug}-{counter}"
        counter += 1


# ===== PROJECT CRUD =====

async def create_project(
    session: AsyncSession,
    user: models.User,
    project_data: ProjectCreate
) -> models.Project:
    """Create a new project"""
    # Generate slug
    base_slug = generate_slug(project_data.name)
    slug = await ensure_unique_slug(session, user.id, base_slug)
    
    # Create project
    project = models.Project(
        user_id=user.id,
        slug=slug,
        **project_data.model_dump()
    )
    
    session.add(project)
    await session.commit()
    await session.refresh(project)
    
    return project


async def get_project(
    session: AsyncSession,
    project_id: str,
    user_id: Optional[str] = None
) -> Optional[models.Project]:
    """Get a project by ID"""
    query = select(models.Project).where(models.Project.id == project_id)
    
    if user_id:
        query = query.where(models.Project.user_id == user_id)
    
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_project_by_slug(
    session: AsyncSession,
    user_id: str,
    slug: str
) -> Optional[models.Project]:
    """Get a project by user ID and slug"""
    result = await session.execute(
        select(models.Project).where(
            and_(
                models.Project.user_id == user_id,
                models.Project.slug == slug
            )
        )
    )
    return result.scalar_one_or_none()


async def list_user_projects(
    session: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    include_archived: bool = False
) -> tuple[List[models.Project], int]:
    """List all projects for a user"""
    # Base query
    query = select(models.Project).where(models.Project.user_id == user_id)
    
    if not include_archived:
        query = query.where(models.Project.is_archived == False)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Get projects with pagination
    query = query.order_by(desc(models.Project.created_at)).offset(skip).limit(limit)
    result = await session.execute(query)
    projects = result.scalars().all()
    
    return list(projects), total


async def update_project(
    session: AsyncSession,
    project_id: str,
    user_id: str,
    project_data: ProjectUpdate
) -> Optional[models.Project]:
    """Update a project"""
    project = await get_project(session, project_id, user_id)
    
    if not project:
        return None
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(project)
    
    return project


async def delete_project(
    session: AsyncSession,
    project_id: str,
    user_id: str
) -> bool:
    """Delete a project"""
    project = await get_project(session, project_id, user_id)
    
    if not project:
        return False
    
    await session.delete(project)
    await session.commit()
    
    return True


async def archive_project(
    session: AsyncSession,
    project_id: str,
    user_id: str
) -> Optional[models.Project]:
    """Archive a project"""
    project = await get_project(session, project_id, user_id)
    
    if not project:
        return None
    
    project.is_archived = True
    project.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(project)
    
    return project


# ===== ENVIRONMENT VARIABLE CRUD =====

async def create_env_var(
    session: AsyncSession,
    project_id: str,
    user_id: str,
    env_var_data: EnvVarCreate
) -> Optional[models.EnvironmentVariable]:
    """Create an environment variable"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return None
    
    # Check if key already exists for this environment
    existing = await session.execute(
        select(models.EnvironmentVariable).where(
            and_(
                models.EnvironmentVariable.project_id == project_id,
                models.EnvironmentVariable.key == env_var_data.key,
                models.EnvironmentVariable.environment == env_var_data.environment
            )
        )
    )
    
    if existing.scalar_one_or_none():
        return None  # Duplicate key
    
    # TODO: Encrypt the value before storing
    env_var = models.EnvironmentVariable(
        project_id=project_id,
        **env_var_data.model_dump()
    )
    
    session.add(env_var)
    await session.commit()
    await session.refresh(env_var)
    
    return env_var


async def list_env_vars(
    session: AsyncSession,
    project_id: str,
    user_id: str,
    environment: Optional[str] = None
) -> List[models.EnvironmentVariable]:
    """List environment variables for a project"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return []
    
    query = select(models.EnvironmentVariable).where(
        models.EnvironmentVariable.project_id == project_id
    )
    
    if environment:
        query = query.where(models.EnvironmentVariable.environment == environment)
    
    result = await session.execute(query)
    return list(result.scalars().all())


async def update_env_var(
    session: AsyncSession,
    env_var_id: str,
    project_id: str,
    user_id: str,
    env_var_data: EnvVarUpdate
) -> Optional[models.EnvironmentVariable]:
    """Update an environment variable"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return None
    
    # Get env var
    result = await session.execute(
        select(models.EnvironmentVariable).where(
            and_(
                models.EnvironmentVariable.id == env_var_id,
                models.EnvironmentVariable.project_id == project_id
            )
        )
    )
    env_var = result.scalar_one_or_none()
    
    if not env_var:
        return None
    
    # Update fields
    update_data = env_var_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'value':
            # TODO: Encrypt the value
            pass
        setattr(env_var, field, value)
    
    env_var.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(env_var)
    
    return env_var


async def delete_env_var(
    session: AsyncSession,
    env_var_id: str,
    project_id: str,
    user_id: str
) -> bool:
    """Delete an environment variable"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return False
    
    # Get and delete env var
    result = await session.execute(
        select(models.EnvironmentVariable).where(
            and_(
                models.EnvironmentVariable.id == env_var_id,
                models.EnvironmentVariable.project_id == project_id
            )
        )
    )
    env_var = result.scalar_one_or_none()
    
    if not env_var:
        return False
    
    await session.delete(env_var)
    await session.commit()
    
    return True


# ===== DOMAIN CRUD =====

async def add_domain(
    session: AsyncSession,
    project_id: str,
    user_id: str,
    domain_data: DomainCreate
) -> Optional[models.Domain]:
    """Add a custom domain to a project"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return None
    
    # Check if domain already exists
    existing = await session.execute(
        select(models.Domain).where(
            models.Domain.domain_name == domain_data.domain_name
        )
    )
    
    if existing.scalar_one_or_none():
        return None  # Domain already in use
    
    # Generate verification token
    import secrets
    verification_token = secrets.token_urlsafe(32)
    
    domain = models.Domain(
        project_id=project_id,
        domain_name=domain_data.domain_name,
        verification_token=verification_token,
        dns_records={
            "type": "A",
            "name": "@",
            "value": "<load-balancer-ip>",  # Will be filled by deployment
            "ttl": 3600
        }
    )
    
    session.add(domain)
    await session.commit()
    await session.refresh(domain)
    
    return domain


async def list_domains(
    session: AsyncSession,
    project_id: str,
    user_id: str
) -> List[models.Domain]:
    """List domains for a project"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return []
    
    result = await session.execute(
        select(models.Domain).where(models.Domain.project_id == project_id)
    )
    return list(result.scalars().all())


async def verify_domain(
    session: AsyncSession,
    domain_id: str,
    project_id: str,
    user_id: str
) -> Optional[models.Domain]:
    """Verify domain ownership"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return None
    
    # Get domain
    result = await session.execute(
        select(models.Domain).where(
            and_(
                models.Domain.id == domain_id,
                models.Domain.project_id == project_id
            )
        )
    )
    domain = result.scalar_one_or_none()
    
    if not domain:
        return None
    
    # TODO: Actually verify the domain via DNS or HTTP
    # For now, just mark as verified
    domain.is_verified = True
    domain.dns_configured = True
    domain.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(domain)
    
    return domain


async def delete_domain(
    session: AsyncSession,
    domain_id: str,
    project_id: str,
    user_id: str
) -> bool:
    """Remove a domain from a project"""
    # Verify project ownership
    project = await get_project(session, project_id, user_id)
    if not project:
        return False
    
    # Get and delete domain
    result = await session.execute(
        select(models.Domain).where(
            and_(
                models.Domain.id == domain_id,
                models.Domain.project_id == project_id
            )
        )
    )
    domain = result.scalar_one_or_none()
    
    if not domain:
        return False
    
    await session.delete(domain)
    await session.commit()
    
    return True


# ===== TEAM CRUD =====

async def create_team(
    session: AsyncSession,
    user: models.User,
    team_data: TeamCreate
) -> models.Team:
    """Create a new team"""
    # Generate slug
    base_slug = generate_slug(team_data.name)
    slug = base_slug
    counter = 1
    
    # Ensure unique slug globally
    while True:
        result = await session.execute(
            select(models.Team).where(models.Team.slug == slug)
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            break
        
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Create team
    team = models.Team(
        owner_id=user.id,
        slug=slug,
        **team_data.model_dump()
    )
    
    session.add(team)
    await session.commit()
    await session.refresh(team)
    
    # Add owner as a member
    member = models.TeamMember(
        team_id=team.id,
        user_id=user.id,
        role="owner"
    )
    session.add(member)
    await session.commit()
    
    return team


async def get_team(
    session: AsyncSession,
    team_id: str
) -> Optional[models.Team]:
    """Get a team by ID"""
    result = await session.execute(
        select(models.Team).where(models.Team.id == team_id)
    )
    return result.scalar_one_or_none()


async def list_user_teams(
    session: AsyncSession,
    user_id: str
) -> List[models.Team]:
    """List all teams where user is a member"""
    result = await session.execute(
        select(models.Team).join(
            models.TeamMember
        ).where(
            models.TeamMember.user_id == user_id
        )
    )
    return list(result.scalars().all())


async def add_team_member(
    session: AsyncSession,
    team_id: str,
    user_id: str,
    invite_data: TeamInviteRequest
) -> Optional[models.TeamMember]:
    """Add a member to a team"""
    # Verify user has permission (owner or admin)
    team = await get_team(session, team_id)
    if not team:
        return None
    
    # Check if inviter is owner or admin
    inviter_result = await session.execute(
        select(models.TeamMember).where(
            and_(
                models.TeamMember.team_id == team_id,
                models.TeamMember.user_id == user_id,
                or_(
                    models.TeamMember.role == "owner",
                    models.TeamMember.role == "admin"
                )
            )
        )
    )
    
    if not inviter_result.scalar_one_or_none():
        return None  # No permission
    
    # Find user by email
    user_result = await session.execute(
        select(models.User).where(models.User.email == invite_data.email)
    )
    target_user = user_result.scalar_one_or_none()
    
    if not target_user:
        return None  # User not found
    
    # Check if already a member
    existing = await session.execute(
        select(models.TeamMember).where(
            and_(
                models.TeamMember.team_id == team_id,
                models.TeamMember.user_id == target_user.id
            )
        )
    )
    
    if existing.scalar_one_or_none():
        return None  # Already a member
    
    # Add member
    member = models.TeamMember(
        team_id=team_id,
        user_id=target_user.id,
        role=invite_data.role
    )
    
    session.add(member)
    await session.commit()
    await session.refresh(member)
    
    return member


async def remove_team_member(
    session: AsyncSession,
    team_id: str,
    member_id: str,
    user_id: str
) -> bool:
    """Remove a member from a team"""
    # Verify permission
    team = await get_team(session, team_id)
    if not team:
        return False
    
    # Check if user is owner or admin
    user_member = await session.execute(
        select(models.TeamMember).where(
            and_(
                models.TeamMember.team_id == team_id,
                models.TeamMember.user_id == user_id,
                or_(
                    models.TeamMember.role == "owner",
                    models.TeamMember.role == "admin"
                )
            )
        )
    )
    
    if not user_member.scalar_one_or_none():
        return False  # No permission
    
    # Get and remove member
    result = await session.execute(
        select(models.TeamMember).where(
            and_(
                models.TeamMember.id == member_id,
                models.TeamMember.team_id == team_id
            )
        )
    )
    member = result.scalar_one_or_none()
    
    if not member or member.role == "owner":
        return False  # Can't remove owner
    
    await session.delete(member)
    await session.commit()
    
    return True
