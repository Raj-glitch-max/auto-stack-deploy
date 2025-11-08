# main.py
import asyncio
import uuid
from datetime import datetime, timezone

import aiohttp
from dotenv import load_dotenv
from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Request,
    WebSocket,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud, models
from .auth import get_current_user, router as auth_router
from .db import AsyncSessionLocal, get_db
from .middleware import ErrorHandlingMiddleware, RateLimitMiddleware
from .schemas import (
    AgentHeartbeat,
    AgentRegister,
    AgentResponse,
    AlertCreate,
    AlertResponse,
    AlertTestWebhook,
    AlertUpdate,
    APIKeyCreate,
    APIKeyListResponse,
    APIKeyResponse,
    AuditLogResponse,
    DeployCreate,
    DeployResponse,
    MetricsOverview,
)

load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="AutoStack API",
    description="AutoStack Deployment and Monitoring API",
    version="1.0.0",
)

# Middleware (order matters - error handling should be last)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.add_middleware(RateLimitMiddleware, calls=5, period=60.0)
app.add_middleware(ErrorHandlingMiddleware)

# Note: Database tables are managed by Alembic migrations
# Run: alembic upgrade head

# Mount Auth router
app.include_router(auth_router, prefix="", tags=["auth"])

# ========================
# Health Check
# ========================


@app.get("/health")
async def health_check():
    """Health check endpoint for uptime monitoring."""
    return {"status": "healthy", "service": "autostack-api"}


# ========================
# Deployment Routes
# ========================

@app.post("/deploy")
async def deploy_endpoint(
    payload: DeployCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deploy_id = str(uuid.uuid4())
    deploy = await crud.create_deploy(
        db,
        user=current_user,
        deploy_id=deploy_id,
        repo=payload.repo,
        branch=payload.branch,
        environment=payload.environment,
    )
    background_tasks.add_task(simulate_deploy_db, str(deploy.id))
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="deploy",
        resource_type="deployment",
        resource_id=str(deploy.id),
        details=f"Deployed {payload.repo} ({payload.branch}) to {payload.environment}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    return {"deploy_id": str(deploy.id)}


async def simulate_deploy_db(deploy_id: str):
    async with AsyncSessionLocal() as session:
        deploy = await crud.get_deploy(session, deploy_id)
        if not deploy:
            return

        await crud.append_log(session, deploy, "[1] Cloning repository...")
        await asyncio.sleep(2)
        await crud.append_log(session, deploy, "[2] Building Docker image...")
        await asyncio.sleep(3)
        await crud.append_log(session, deploy, "[3] Starting container...")
        await asyncio.sleep(2)
        await crud.append_log(session, deploy, "[4] Deployment succeeded ✅")
        deploy.status = "success"
        await session.commit()

@app.get("/deployments")
async def list_deploys(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    deploys = await crud.list_user_deploys(db, current_user)
    return {
        "deployments": [
            DeployResponse(
                id=str(d.id),
                repo=d.repo,
                branch=d.branch,
                environment=d.environment,
                status=d.status,
                created_at=d.created_at,
                logs=d.logs,
            )
            for d in deploys
        ]
    }

@app.get("/status/{deploy_id}")
async def get_deploy_status(
    deploy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deploy = await crud.get_deploy(db, deploy_id)
    if not deploy:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if deploy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "id": str(deploy.id),
        "repo": deploy.repo,
        "branch": deploy.branch,
        "status": deploy.status,
        "logs": deploy.logs,
    }


# ========================
# Agents API
# ========================


@app.post("/agents/register", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def register_agent(
    payload: AgentRegister,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Register a new monitoring agent."""
    agent = await crud.create_agent(
        db, user=current_user, name=payload.name, host=payload.host, ip=payload.ip
    )
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="agent_register",
        resource_type="agent",
        resource_id=str(agent.id),
        details=f"Registered agent {payload.name} on {payload.host}",
        ip_address=request.client.host if request.client else None,
    )
    
    return agent


@app.post("/agents/heartbeat", response_model=AgentResponse)
async def agent_heartbeat(
    payload: AgentHeartbeat,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update agent heartbeat with system metrics."""
    agent = await crud.get_agent(db, payload.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    agent = await crud.update_agent_heartbeat(
        db, agent, payload.cpu_usage, payload.memory_usage
    )
    
    # Store metrics
    await crud.create_metric(
        db,
        user=current_user,
        agent_id=payload.agent_id,
        cpu_usage=payload.cpu_usage,
        memory_usage=payload.memory_usage,
    )
    
    return agent


@app.get("/agents", response_model=list[AgentResponse])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all agents for the current user."""
    agents = await crud.list_user_agents(db, current_user)
    return agents


# ========================
# Alerts API
# ========================


@app.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new alert."""
    alert = await crud.create_alert(
        db,
        user=current_user,
        severity=payload.severity,
        source=payload.source,
        message=payload.message,
        webhook_url=payload.webhook_url,
    )
    
    # Trigger webhook if provided
    if payload.webhook_url:
        background_tasks.add_task(send_webhook, payload.webhook_url, alert)
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="alert_create",
        resource_type="alert",
        resource_id=str(alert.id),
        details=f"Created {payload.severity} alert: {payload.message}",
        ip_address=request.client.host if request.client else None,
    )
    
    return alert


async def send_webhook(webhook_url: str, alert: models.Alert):
    """Send webhook notification for alert."""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "id": str(alert.id),
                "severity": alert.severity,
                "source": alert.source,
                "message": alert.message,
                "created_at": alert.created_at.isoformat(),
            }
            async with session.post(webhook_url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status >= 200 and response.status < 300:
                    print(f"Webhook sent successfully to {webhook_url}")
                else:
                    print(f"Webhook failed with status {response.status}")
    except Exception as e:
        print(f"Error sending webhook: {e}")


@app.get("/alerts", response_model=list[AlertResponse])
async def list_alerts(
    resolved: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List alerts for the current user."""
    alerts = await crud.list_user_alerts(db, current_user, resolved=resolved)
    return alerts


@app.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get a specific alert."""
    alert = await crud.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return alert


@app.patch("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update an alert."""
    alert = await crud.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    alert = await crud.update_alert(
        db, alert, resolved=payload.resolved, webhook_url=payload.webhook_url
    )
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="alert_update",
        resource_type="alert",
        resource_id=str(alert.id),
        details=f"Updated alert: resolved={payload.resolved}",
        ip_address=request.client.host if request.client else None,
    )
    
    return alert


@app.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete an alert."""
    alert = await crud.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await crud.delete_alert(db, alert)
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="alert_delete",
        resource_type="alert",
        resource_id=str(alert_id),
        ip_address=request.client.host if request.client else None,
    )


@app.post("/alerts/test-webhook")
async def test_webhook(
    payload: AlertTestWebhook,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Test webhook endpoint by sending a test alert."""
    # Create test alert
    alert = await crud.create_alert(
        db,
        user=current_user,
        severity="info",
        source="test",
        message=payload.message,
        webhook_url=payload.webhook_url,
    )
    
    # Send webhook
    await send_webhook(payload.webhook_url, alert)
    
    return {"detail": "Test webhook sent", "alert_id": str(alert.id)}


# ========================
# Metrics API
# ========================


@app.get("/metrics/overview", response_model=MetricsOverview)
async def get_metrics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get metrics overview for the current user."""
    overview = await crud.get_metrics_overview(db, current_user)
    return overview


# ========================
# API Keys API
# ========================


@app.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: APIKeyCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new API key."""
    import secrets
    
    from .auth import hash_token

    # Generate API key
    api_key = f"ask_{secrets.token_urlsafe(32)}"
    key_hash = hash_token(api_key)
    
    # Store in database
    api_key_obj = await crud.create_api_key(db, user=current_user, name=payload.name, key_hash=key_hash)
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="api_key_create",
        resource_type="api_key",
        resource_id=str(api_key_obj.id),
        details=f"Created API key: {payload.name}",
        ip_address=request.client.host if request.client else None,
    )
    
    return APIKeyResponse(
        id=str(api_key_obj.id),
        name=api_key_obj.name,
        key=api_key,  # Only shown once
        last_used=api_key_obj.last_used,
        created_at=api_key_obj.created_at,
    )


@app.get("/api-keys", response_model=list[APIKeyListResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all API keys for the current user."""
    api_keys = await crud.list_user_api_keys(db, current_user)
    return [
        APIKeyListResponse(
            id=str(key.id),
            name=key.name,
            last_used=key.last_used,
            created_at=key.created_at,
        )
        for key in api_keys
    ]


@app.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete an API key."""
    api_keys = await crud.list_user_api_keys(db, current_user)
    api_key = next((k for k in api_keys if str(k.id) == key_id), None)
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    await crud.delete_api_key(db, api_key)
    
    # Audit log
    await crud.create_audit_log(
        db,
        user=current_user,
        action="api_key_delete",
        resource_type="api_key",
        resource_id=str(key_id),
        ip_address=request.client.host if request.client else None,
    )


# ========================
# Audit Logs API
# ========================


@app.get("/audit-logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List audit logs for the current user."""
    logs = await crud.list_user_audit_logs(db, current_user, limit=limit)
    return logs


# ========================
# WebSocket (Real-time Logs)
# ========================


@app.websocket("/ws/logs/{deploy_id}")
async def websocket_logs(websocket: WebSocket, deploy_id: str):
    """WebSocket endpoint for real-time deployment logs."""
    await websocket.accept()
    
    async with AsyncSessionLocal() as session:
        deploy = await crud.get_deploy(session, deploy_id)
        if not deploy:
            await websocket.close(code=1008, reason="Deployment not found")
            return

        # Send existing logs
        if deploy.logs:
            await websocket.send_text(deploy.logs)

        # Simulate new logs
        for i in range(6):
            log_line = f"[{datetime.now(timezone.utc).isoformat()}] Log line {i} for {deploy_id}\n"
            await websocket.send_text(log_line)
            await asyncio.sleep(1)
    
    await websocket.close()


