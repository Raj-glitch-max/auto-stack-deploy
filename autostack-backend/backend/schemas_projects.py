"""
Pydantic schemas for Projects, EnvVars, Domains, Teams
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re


# ===== PROJECT SCHEMAS =====

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    github_repo: str = Field(..., min_length=1, max_length=500)
    default_branch: str = Field(default="main", max_length=100)
    
    # Build configuration
    framework: Optional[str] = None
    build_command: Optional[str] = None
    install_command: Optional[str] = Field(default="npm install")
    output_directory: Optional[str] = None
    root_directory: Optional[str] = Field(default="/")
    node_version: Optional[str] = Field(default="18")
    
    # Deployment settings
    auto_deploy_enabled: bool = Field(default=True)
    auto_deploy_branch: Optional[str] = Field(default="main")
    
    # Resource settings
    cpu_limit: Optional[str] = Field(default="500m")
    memory_limit: Optional[str] = Field(default="512Mi")
    min_replicas: int = Field(default=2, ge=1, le=10)
    max_replicas: int = Field(default=10, ge=2, le=50)
    
    is_public: bool = Field(default=False)
    
    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z0-9-_\s]+$', v):
            raise ValueError('Project name can only contain letters, numbers, hyphens, underscores, and spaces')
        return v
    
    @validator('github_repo')
    def validate_github_repo(cls, v):
        # Basic GitHub URL validation
        if not v.startswith(('https://github.com/', 'git@github.com:')):
            raise ValueError('Must be a valid GitHub repository URL')
        return v
    
    @validator('max_replicas')
    def validate_replicas(cls, v, values):
        if 'min_replicas' in values and v < values['min_replicas']:
            raise ValueError('max_replicas must be greater than or equal to min_replicas')
        return v


class ProjectCreate(ProjectBase):
    """Schema for creating a new project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_branch: Optional[str] = None
    framework: Optional[str] = None
    build_command: Optional[str] = None
    install_command: Optional[str] = None
    output_directory: Optional[str] = None
    root_directory: Optional[str] = None
    node_version: Optional[str] = None
    auto_deploy_enabled: Optional[bool] = None
    auto_deploy_branch: Optional[str] = None
    cpu_limit: Optional[str] = None
    memory_limit: Optional[str] = None
    min_replicas: Optional[int] = Field(None, ge=1, le=10)
    max_replicas: Optional[int] = Field(None, ge=2, le=50)
    is_public: Optional[bool] = None
    is_archived: Optional[bool] = None


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    id: str
    user_id: str
    slug: str
    github_repo_id: Optional[int] = None
    production_url: Optional[str] = None
    production_deployment_id: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    deployment_count: Optional[int] = None
    last_deployment: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for listing projects"""
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int


# ===== ENVIRONMENT VARIABLE SCHEMAS =====

class EnvVarBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)
    environment: str = Field(default="production", max_length=50)
    is_sensitive: bool = Field(default=True)
    
    @validator('key')
    def validate_key(cls, v):
        if not re.match(r'^[A-Z0-9_]+$', v):
            raise ValueError('Environment variable key must be uppercase letters, numbers, and underscores only')
        return v
    
    @validator('environment')
    def validate_environment(cls, v):
        allowed = ['production', 'preview', 'development']
        if v not in allowed:
            raise ValueError(f'Environment must be one of: {", ".join(allowed)}')
        return v


class EnvVarCreate(EnvVarBase):
    """Schema for creating environment variable"""
    pass


class EnvVarUpdate(BaseModel):
    """Schema for updating environment variable"""
    value: Optional[str] = None
    environment: Optional[str] = None
    is_sensitive: Optional[bool] = None


class EnvVarResponse(BaseModel):
    """Schema for environment variable response"""
    id: str
    project_id: str
    key: str
    value: str  # Will be masked if sensitive
    environment: str
    is_sensitive: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EnvVarListResponse(BaseModel):
    """Schema for listing environment variables"""
    variables: List[EnvVarResponse]
    total: int


# ===== DOMAIN SCHEMAS =====

class DomainBase(BaseModel):
    domain_name: str = Field(..., min_length=3, max_length=255)
    
    @validator('domain_name')
    def validate_domain(cls, v):
        # Basic domain validation
        pattern = r'^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$'
        if not re.match(pattern, v.lower()):
            raise ValueError('Invalid domain name format')
        return v.lower()


class DomainCreate(DomainBase):
    """Schema for adding a custom domain"""
    pass


class DomainResponse(BaseModel):
    """Schema for domain response"""
    id: str
    project_id: str
    domain_name: str
    is_verified: bool
    verification_token: Optional[str] = None
    ssl_status: Optional[str] = None
    ssl_cert_arn: Optional[str] = None
    dns_configured: bool
    dns_records: Optional[dict] = None
    is_primary: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DomainListResponse(BaseModel):
    """Schema for listing domains"""
    domains: List[DomainResponse]
    total: int


class DomainVerifyRequest(BaseModel):
    """Schema for domain verification request"""
    verification_method: str = Field(default="dns")  # dns or http


# ===== TEAM SCHEMAS =====

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    
    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z0-9-_\s]+$', v):
            raise ValueError('Team name can only contain letters, numbers, hyphens, underscores, and spaces')
        return v


class TeamCreate(TeamBase):
    """Schema for creating a team"""
    pass


class TeamUpdate(BaseModel):
    """Schema for updating a team"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None


class TeamMemberRole(str):
    """Team member roles"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class TeamMemberResponse(BaseModel):
    """Schema for team member response"""
    id: str
    user_id: str
    role: str
    joined_at: datetime
    
    # User info (joined)
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    """Schema for team response"""
    id: str
    name: str
    slug: str
    owner_id: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    member_count: Optional[int] = None
    members: Optional[List[TeamMemberResponse]] = None
    
    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    """Schema for listing teams"""
    teams: List[TeamResponse]
    total: int


class TeamInviteRequest(BaseModel):
    """Schema for inviting a team member"""
    email: str = Field(..., min_length=3, max_length=255)
    role: str = Field(default="member")
    
    @validator('email')
    def validate_email(cls, v):
        # Basic email validation
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('role')
    def validate_role(cls, v):
        allowed = ['admin', 'member', 'viewer']
        if v not in allowed:
            raise ValueError(f'Role must be one of: {", ".join(allowed)}')
        return v


class TeamMemberUpdateRole(BaseModel):
    """Schema for updating team member role"""
    role: str
    
    @validator('role')
    def validate_role(cls, v):
        allowed = ['owner', 'admin', 'member', 'viewer']
        if v not in allowed:
            raise ValueError(f'Role must be one of: {", ".join(allowed)}')
        return v


# ===== DEPLOYMENT SCHEMAS (Enhanced) =====

class DeploymentCreateFromProject(BaseModel):
    """Schema for creating a deployment from a project"""
    project_id: str
    branch: Optional[str] = None  # If not provided, use project's default branch
    environment: str = Field(default="production")
    is_production: bool = Field(default=True)
    
    @validator('environment')
    def validate_environment(cls, v):
        allowed = ['production', 'preview', 'development']
        if v not in allowed:
            raise ValueError(f'Environment must be one of: {", ".join(allowed)}')
        return v


class DeploymentResponseEnhanced(BaseModel):
    """Enhanced deployment response with project info"""
    id: str
    project_id: Optional[str] = None
    user_id: str
    repo: str
    branch: str
    environment: str
    status: str
    
    # Commit info
    commit_sha: Optional[str] = None
    commit_message: Optional[str] = None
    commit_author: Optional[str] = None
    
    # URLs
    url: Optional[str] = None
    deployment_url: Optional[str] = None
    
    # Timing
    build_time_seconds: Optional[int] = None
    deploy_time_seconds: Optional[int] = None
    total_time_seconds: Optional[int] = None
    
    # Metadata
    is_production: bool
    creator_type: Optional[str] = None
    app_name: Optional[str] = None
    
    created_at: datetime
    
    # Project info (joined)
    project_name: Optional[str] = None
    project_slug: Optional[str] = None
    
    class Config:
        from_attributes = True


# ===== ANALYTICS SCHEMAS =====

class AnalyticsOverview(BaseModel):
    """Analytics overview for a project"""
    total_requests: int
    total_bandwidth_mb: float
    avg_response_time_ms: float
    error_rate: float
    uptime_percentage: float
    
    # Time series data
    requests_by_hour: List[dict]
    errors_by_type: List[dict]
    top_paths: List[dict]
    geography: List[dict]


class AnalyticsRequest(BaseModel):
    """Request for analytics data"""
    project_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    granularity: str = Field(default="hour")  # hour, day, week
    
    @validator('granularity')
    def validate_granularity(cls, v):
        allowed = ['hour', 'day', 'week', 'month']
        if v not in allowed:
            raise ValueError(f'Granularity must be one of: {", ".join(allowed)}')
        return v
