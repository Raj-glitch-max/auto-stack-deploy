from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # OAuth fields
    github_token = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    google_id = Column(String, nullable=True, unique=True, index=True)
    google_email = Column(String, nullable=True)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)

    deployments = relationship("Deploy", back_populates="user", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    # New relationships for projects and teams
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    owned_teams = relationship("Team", back_populates="owner", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")


class Deploy(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    repo = Column(String, nullable=False)
    branch = Column(String, default="main", nullable=False)
    environment = Column(String, default="dev", nullable=False)
    status = Column(String, default="queued", nullable=False)
    logs = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Deploy engine fields
    port = Column(Integer, nullable=True)
    container_id = Column(String, nullable=True)
    url = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # New fields for enhanced deployment tracking
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    commit_message = Column(Text, nullable=True)
    commit_author = Column(String(255), nullable=True)
    deployment_url = Column(String(500), nullable=True)
    build_time_seconds = Column(Integer, nullable=True)
    deploy_time_seconds = Column(Integer, nullable=True)
    total_time_seconds = Column(Integer, nullable=True)
    is_production = Column(Boolean, default=False, nullable=False)
    creator_type = Column(String(50), nullable=True)  # manual, webhook, api
    app_name = Column(String(255), nullable=True)  # K8s app name

    user = relationship("User", back_populates="deployments")
    project = relationship("Project", back_populates="deployments")
    analytics_events = relationship("AnalyticsEvent", back_populates="deployment", cascade="all, delete-orphan")
    deployment_logs = relationship("DeploymentLog", back_populates="deployment", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    host = Column(String, nullable=False)
    ip = Column(String, nullable=False)
    status = Column(String, default="offline", nullable=False)  # online, offline
    cpu_usage = Column(Float, default=0.0, nullable=False)
    memory_usage = Column(Float, default=0.0, nullable=False)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="agents")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = Column(String, nullable=False)  # critical, warning, info
    source = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
    webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="alerts")


class Metrics(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id", ondelete="CASCADE"), nullable=True)
    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    disk_usage = Column(Float, nullable=True)
    network_in = Column(Float, nullable=True)
    network_out = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String, nullable=False)  # login, deploy, alert, etc.
    resource_type = Column(String, nullable=True)  # deployment, alert, agent, etc.
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)  # Changed from Text to JSON to match migration
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="audit_logs")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True, index=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="api_keys")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="refresh_tokens")


# ===== NEW MODELS FOR ENHANCED PLATFORM =====

class Project(Base):
    """Project model - represents a user's deployed project"""
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # GitHub integration
    github_repo = Column(String(500), nullable=False)
    github_repo_id = Column(BigInteger, nullable=True)
    default_branch = Column(String(100), nullable=False, default="main")
    
    # Build configuration
    framework = Column(String(100), nullable=True)
    build_command = Column(String(500), nullable=True)
    install_command = Column(String(500), nullable=True, default="npm install")
    output_directory = Column(String(255), nullable=True)
    root_directory = Column(String(255), nullable=True, default="/")
    node_version = Column(String(20), nullable=True, default="18")
    
    # Deployment settings
    production_url = Column(String(500), nullable=True)
    production_deployment_id = Column(String, nullable=True)
    auto_deploy_enabled = Column(Boolean, nullable=False, default=True)
    auto_deploy_branch = Column(String(100), nullable=True, default="main")
    
    # Resource settings
    cpu_limit = Column(String(20), nullable=True, default="500m")
    memory_limit = Column(String(20), nullable=True, default="512Mi")
    min_replicas = Column(Integer, nullable=False, default=2)
    max_replicas = Column(Integer, nullable=False, default=10)
    
    # Metadata
    is_public = Column(Boolean, nullable=False, default=False)
    is_archived = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    deployments = relationship("Deploy", back_populates="project", cascade="all, delete-orphan")
    environment_variables = relationship("EnvironmentVariable", back_populates="project", cascade="all, delete-orphan")
    domains = relationship("Domain", back_populates="project", cascade="all, delete-orphan")
    analytics_events = relationship("AnalyticsEvent", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name} ({self.id})>"


class EnvironmentVariable(Base):
    """Environment variables for projects"""
    __tablename__ = "environment_variables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)  # Will be encrypted
    environment = Column(String(50), nullable=False, default="production")
    is_sensitive = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="environment_variables")

    def __repr__(self):
        return f"<EnvVar {self.key} for Project {self.project_id}>"


class Domain(Base):
    """Custom domains for projects"""
    __tablename__ = "domains"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    domain_name = Column(String(255), nullable=False, unique=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String(255), nullable=True)
    ssl_status = Column(String(50), nullable=True)
    ssl_cert_arn = Column(String(500), nullable=True)
    dns_configured = Column(Boolean, nullable=False, default=False)
    dns_records = Column(JSON, nullable=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="domains")

    def __repr__(self):
        return f"<Domain {self.domain_name}>"


class Team(Base):
    """Teams for collaboration"""
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Team {self.name}>"


class TeamMember(Base):
    """Team membership"""
    __tablename__ = "team_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, default="member")
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

    def __repr__(self):
        return f"<TeamMember {self.user_id} in {self.team_id}>"


class AnalyticsEvent(Base):
    """Analytics events for deployments"""
    __tablename__ = "analytics_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    path = Column(String(500), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    country = Column(String(2), nullable=True)
    city = Column(String(100), nullable=True)
    metadata = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    deployment = relationship("Deploy", back_populates="analytics_events")
    project = relationship("Project", back_populates="analytics_events")

    def __repr__(self):
        return f"<AnalyticsEvent {self.event_type} at {self.timestamp}>"


class DeploymentLog(Base):
    """Logs for deployments"""
    __tablename__ = "deployment_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    log_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    deployment = relationship("Deploy", back_populates="deployment_logs")

    def __repr__(self):
        return f"<DeploymentLog {self.log_type} at {self.timestamp}>"


# ===== COST TRACKING MODELS =====

class CostSnapshot(Base):
    """Real-time cost tracking snapshots"""
    __tablename__ = "cost_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Cost breakdown
    total_cost = Column(Float, nullable=False, default=0.0)
    compute_cost = Column(Float, nullable=False, default=0.0)
    storage_cost = Column(Float, nullable=False, default=0.0)
    bandwidth_cost = Column(Float, nullable=False, default=0.0)
    database_cost = Column(Float, nullable=False, default=0.0)
    other_cost = Column(Float, nullable=False, default=0.0)
    
    # Cloud provider info
    cloud_provider = Column(String(50), nullable=False)
    region = Column(String(100), nullable=True)
    
    # Detailed breakdown
    breakdown = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")

    def __repr__(self):
        return f"<CostSnapshot ${self.total_cost} at {self.timestamp}>"


class CostPrediction(Base):
    """AI-powered cost predictions"""
    __tablename__ = "cost_predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Predictions
    predicted_daily_cost = Column(Float, nullable=False)
    predicted_monthly_cost = Column(Float, nullable=False)
    predicted_yearly_cost = Column(Float, nullable=False)
    
    # Confidence and model info
    confidence_score = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    
    # Historical data used
    days_of_data_used = Column(Integer, nullable=False)
    prediction_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")

    def __repr__(self):
        return f"<CostPrediction ${self.predicted_monthly_cost}/month>"


class BudgetAlert(Base):
    """User-defined budget limits and alerts"""
    __tablename__ = "budget_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Budget settings
    budget_limit = Column(Float, nullable=False)
    budget_period = Column(String(20), nullable=False, default='monthly')
    alert_threshold = Column(Float, nullable=False, default=0.80)
    
    # Current status
    current_spend = Column(Float, nullable=False, default=0.0)
    is_exceeded = Column(Boolean, nullable=False, default=False)
    last_alert_sent = Column(DateTime, nullable=True)
    
    # Actions
    auto_scale_down = Column(Boolean, nullable=False, default=False)
    auto_pause = Column(Boolean, nullable=False, default=False)
    notification_channels = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")

    def __repr__(self):
        return f"<BudgetAlert ${self.budget_limit} {self.budget_period}>"


class CostRecommendation(Base):
    """AI-generated cost optimization recommendations"""
    __tablename__ = "cost_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Recommendation details
    recommendation_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    impact = Column(String(20), nullable=False)
    
    # Cost savings
    estimated_monthly_savings = Column(Float, nullable=False)
    estimated_yearly_savings = Column(Float, nullable=False)
    savings_percentage = Column(Float, nullable=False)
    
    # Implementation
    implementation_effort = Column(String(20), nullable=False)
    implementation_steps = Column(JSON, nullable=True)
    can_auto_apply = Column(Boolean, nullable=False, default=False)
    
    # Status
    status = Column(String(50), nullable=False, default='pending')
    applied_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    
    # Metadata
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")

    def __repr__(self):
        return f"<CostRecommendation {self.title} - Save ${self.estimated_monthly_savings}/month>"


class CostAnomaly(Base):
    """Unusual cost spikes and anomalies"""
    __tablename__ = "cost_anomalies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Anomaly details
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    
    # Cost impact
    expected_cost = Column(Float, nullable=False)
    actual_cost = Column(Float, nullable=False)
    cost_difference = Column(Float, nullable=False)
    percentage_increase = Column(Float, nullable=False)
    
    # Detection
    detected_at = Column(DateTime, nullable=False)
    detection_method = Column(String(100), nullable=False)
    
    # Resolution
    status = Column(String(50), nullable=False, default='open')
    root_cause = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Metadata
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")

    def __repr__(self):
        return f"<CostAnomaly {self.severity} - ${self.cost_difference} increase>"


class CloudCredential(Base):
    """Secure storage for cloud provider credentials"""
    __tablename__ = "cloud_credentials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Provider info
    cloud_provider = Column(String(50), nullable=False)
    credential_name = Column(String(255), nullable=False)
    
    # Encrypted credentials
    encrypted_credentials = Column(Text, nullable=False)
    encryption_key_id = Column(String(255), nullable=False)
    
    # Permissions
    has_cost_access = Column(Boolean, nullable=False, default=False)
    has_deployment_access = Column(Boolean, nullable=False, default=False)
    permissions = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    last_validated = Column(DateTime, nullable=True)
    validation_status = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<CloudCredential {self.cloud_provider} - {self.credential_name}>"
