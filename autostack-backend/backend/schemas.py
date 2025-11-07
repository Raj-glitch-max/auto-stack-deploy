from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        orm_mode = True

# Deployment schemas
class DeployCreate(BaseModel):
    repo: str
    branch: Optional[str] = "main"
    environment: Optional[str] = "dev"
