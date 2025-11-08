from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ========================
# User schemas
# ========================


class UserBase(BaseModel):
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(UserBase):
    id: str
    created_at: datetime


# ========================
# Token schemas
# ========================


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class TokenPayload(BaseModel):
    sub: str
    exp: int


# ========================
# Deployment schemas
# ========================


class DeployCreate(BaseModel):
    repo: str
    branch: Optional[str] = "main"
    environment: Optional[str] = "dev"


class DeployResponse(DeployCreate):
    id: str
    status: str
    logs: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========================
# Agent schemas
# ========================


class AgentRegister(BaseModel):
    name: str
    host: str
    ip: str


class AgentHeartbeat(BaseModel):
    agent_id: str
    cpu_usage: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0, le=100)


class AgentResponse(BaseModel):
    id: str
    name: str
    host: str
    ip: str
    status: str
    cpu_usage: float
    memory_usage: float
    last_heartbeat: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========================
# Alert schemas
# ========================


class AlertCreate(BaseModel):
    severity: str = Field(pattern=r"^(critical|warning|info)$")
    source: str
    message: str
    webhook_url: Optional[str] = None


class AlertUpdate(BaseModel):
    resolved: Optional[bool] = None
    webhook_url: Optional[str] = None


class AlertResponse(BaseModel):
    id: str
    severity: str
    source: str
    message: str
    resolved: bool
    webhook_url: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertTestWebhook(BaseModel):
    webhook_url: str
    message: Optional[str] = "Test alert webhook"


# ========================
# Metrics schemas
# ========================


class MetricsOverview(BaseModel):
    total_cpu_usage: float
    total_memory_usage: float
    uptime_percentage: float
    active_agents: int
    total_agents: int


class MetricsCreate(BaseModel):
    agent_id: Optional[str] = None
    cpu_usage: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0, le=100)
    disk_usage: Optional[float] = None
    network_in: Optional[float] = None
    network_out: Optional[float] = None


class MetricsResponse(BaseModel):
    id: str
    agent_id: Optional[str]
    cpu_usage: float
    memory_usage: float
    disk_usage: Optional[float]
    network_in: Optional[float]
    network_out: Optional[float]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ========================
# API Key schemas
# ========================


class APIKeyCreate(BaseModel):
    name: str


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Only shown once on creation
    last_used: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class APIKeyListResponse(BaseModel):
    id: str
    name: str
    last_used: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========================
# Refresh Token schemas
# ========================


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenResponseWithRefresh(TokenResponse):
    refresh_token: str


# ========================
# Audit Log schemas
# ========================


class AuditLogResponse(BaseModel):
    id: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
