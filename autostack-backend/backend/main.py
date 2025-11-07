# main.py
import os
import uuid
import asyncio
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

from .db import engine, Base, get_db
from . import models, auth, crud
from .auth import router as auth_router
from .schemas import DeployCreate

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="AutoStack API (MVP)")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ✅ Proper async DB initialization using FastAPI lifecycle
@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables ensured.")

# Mount Auth router
app.include_router(auth_router, prefix="", tags=["auth"])

# ========================
# Auth + Token Verification
# ========================
SECRET_KEY = os.getenv("SECRET_KEY")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========================
# Deployment Routes
# ========================

@app.post("/deploy")
async def deploy_endpoint(
    payload: DeployCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user_email: str = Depends(get_current_user_email)
):
    deploy_id = str(uuid.uuid4())
    user = await crud.get_user_by_email(db, user_email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    deploy = await crud.create_deploy(db, user, deploy_id, payload.repo, payload.branch, payload.environment)
    background_tasks.add_task(simulate_deploy_db, deploy.id)
    return {"deploy_id": deploy.id}

async def simulate_deploy_db(deploy_id: str):
    async with AsyncSession(engine) as db:
        d = await crud.get_deploy(db, deploy_id)
        await crud.append_log(db, d, "[1] Cloning repository...")
        await asyncio.sleep(2)
        await crud.append_log(db, d, "[2] Building Docker image...")
        await asyncio.sleep(3)
        await crud.append_log(db, d, "[3] Starting container...")
        await asyncio.sleep(2)
        await crud.append_log(db, d, "[4] Deployment succeeded ✅")
        d.status = "success"
        await db.commit()

@app.get("/deployments")
async def list_deploys(
    db: AsyncSession = Depends(get_db),
    user_email: str = Depends(get_current_user_email)
):
    user = await crud.get_user_by_email(db, user_email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    deploys = await crud.list_user_deploys(db, user)
    return {
        "deployments": [
            {
                "id": d.id,
                "repo": d.repo,
                "branch": d.branch,
                "environment": d.environment,
                "status": d.status,
                "created_at": d.created_at.isoformat(),
                "logs": d.logs,
            }
            for d in deploys
        ]
    }

@app.get("/status/{deploy_id}")
async def status(
    deploy_id: str,
    db: AsyncSession = Depends(get_db),
    user_email: str = Depends(get_current_user_email)
):
    d = await crud.get_deploy(db, deploy_id)
    if not d:
        raise HTTPException(status_code=404, detail="not found")
    if d.user is None or d.user.email != user_email:
        raise HTTPException(status_code=403, detail="forbidden")

    return {
        "id": d.id,
        "repo": d.repo,
        "branch": d.branch,
        "status": d.status,
        "logs": d.logs,
    }

# ========================
# WebSocket (Simulated Logs)
# ========================

@app.websocket("/ws/logs/{deploy_id}")
async def websocket_logs(websocket: WebSocket, deploy_id: str):
    await websocket.accept()
    for i in range(6):
        await websocket.send_text(f"[{i}] log line for {deploy_id}")
        await asyncio.sleep(1)
    await websocket.close()

