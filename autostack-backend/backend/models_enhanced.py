"""
Enhanced SQLAlchemy models for AutoStack platform
"""
from datetime import datetime
from typing import Optional, List
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .db import Base


class Project(Base):
    """Project model - represents a user's deployed project"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
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
    production_deployment_id = Column(UUID(as_uuid=True), nullable=True)
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
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="projects")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
    environment_variables = relationship("EnvironmentVariable", back_populates="project", cascade="all, delete-orphan")
    domains = relationship("Domain", back_populates="project", cascade="all, delete-orphan")
    analytics_events = relationship("AnalyticsEvent", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name} ({self.id})>"


class EnvironmentVariable(Base):
    """Environment variables for projects"""
    __tablename__ = "environment_variables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)  # Will be encrypted
    environment = Column(String(50), nullable=False, default="production")
    is_sensitive = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="environment_variables")

    def __repr__(self):
        return f"<EnvVar {self.key} for Project {self.project_id}>"


class Domain(Base):
    """Custom domains for projects"""
    __tablename__ = "domains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    domain_name = Column(String(255), nullable=False, unique=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String(255), nullable=True)
    ssl_status = Column(String(50), nullable=True)
    ssl_cert_arn = Column(String(500), nullable=True)
    dns_configured = Column(Boolean, nullable=False, default=False)
    dns_records = Column(JSONB, nullable=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="domains")

    def __repr__(self):
        return f"<Domain {self.domain_name}>"


class Team(Base):
    """Teams for collaboration"""
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Team {self.name}>"


class TeamMember(Base):
    """Team membership"""
    __tablename__ = "team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False, default="member")
    joined_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

    def __repr__(self):
        return f"<TeamMember {self.user_id} in {self.team_id}>"


class AnalyticsEvent(Base):
    """Analytics events for deployments"""
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deployment_id = Column(UUID(as_uuid=True), ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    path = Column(String(500), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    country = Column(String(2), nullable=True)
    city = Column(String(100), nullable=True)
    metadata = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    deployment = relationship("Deployment", back_populates="analytics_events")
    project = relationship("Project", back_populates="analytics_events")

    def __repr__(self):
        return f"<AnalyticsEvent {self.event_type} at {self.timestamp}>"


class DeploymentLog(Base):
    """Logs for deployments"""
    __tablename__ = "deployment_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deployment_id = Column(UUID(as_uuid=True), ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    log_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    deployment = relationship("Deployment", back_populates="deployment_logs")

    def __repr__(self):
        return f"<DeploymentLog {self.log_type} at {self.timestamp}>"


# Update existing User model relationships
def enhance_user_model(User):
    """Add new relationships to existing User model"""
    User.projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    User.owned_teams = relationship("Team", back_populates="owner", cascade="all, delete-orphan")
    User.team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    return User


# Update existing Deployment model
def enhance_deployment_model(Deployment):
    """Add new fields and relationships to existing Deployment model"""
    Deployment.project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    Deployment.commit_sha = Column(String(40), nullable=True)
    Deployment.commit_message = Column(Text, nullable=True)
    Deployment.commit_author = Column(String(255), nullable=True)
    Deployment.deployment_url = Column(String(500), nullable=True)
    Deployment.build_time_seconds = Column(Integer, nullable=True)
    Deployment.deploy_time_seconds = Column(Integer, nullable=True)
    Deployment.total_time_seconds = Column(Integer, nullable=True)
    Deployment.is_production = Column(Boolean, nullable=False, default=False)
    Deployment.creator_type = Column(String(50), nullable=True)
    Deployment.app_name = Column(String(255), nullable=True)
    
    # Relationships
    Deployment.project = relationship("Project", back_populates="deployments")
    Deployment.analytics_events = relationship("AnalyticsEvent", back_populates="deployment", cascade="all, delete-orphan")
    Deployment.deployment_logs = relationship("DeploymentLog", back_populates="deployment", cascade="all, delete-orphan")
    
    return Deployment
