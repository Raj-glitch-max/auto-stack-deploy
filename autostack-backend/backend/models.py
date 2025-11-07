from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deployments = relationship("Deploy", back_populates="user")

class Deploy(Base):
    __tablename__ = "deployments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo = Column(String, nullable=False)
    branch = Column(String, default="main")
    environment = Column(String, default="dev")
    status = Column(String, default="queued")
    logs = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    user = relationship("User", back_populates="deployments")
