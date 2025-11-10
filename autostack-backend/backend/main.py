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
from sqlalchemy import text

from . import crud, models
from .auth import get_current_user, router as auth_router
from .db import AsyncSessionLocal, get_db
from .middleware import ErrorHandlingMiddleware, RateLimitMiddleware
from .deploy_engine import DeployEngine
from .k8s_deploy_engine import K8sDeployEngine
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
    description="AutoStack Deployment and Monitoring API with Google & GitHub OAuth",
    version="1.0.0",
)

# Middleware (order matters - error handling should be last)
import os
import re

# CORS configuration - allow all localhost, 127.0.0.1, and frontend container origins
def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed (localhost, 127.0.0.1, or frontend container on any port)"""
    if not origin:
        return False
    # Allow localhost, 127.0.0.1, and frontend container on any port
    # Also allow http://frontend:3000 for Docker internal networking
    pattern = r'^https?://(localhost|127\.0\.0\.1|frontend)(:\d+)?$'
    return bool(re.match(pattern, origin))

# Custom CORS middleware that allows localhost/127.0.0.1 dynamically
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")
        
        # Handle preflight
        if request.method == "OPTIONS":
            if origin and is_allowed_origin(origin):
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Max-Age": "3600",
                    }
                )
            else:
                # Return 403 for disallowed origins on preflight
                return Response(status_code=403, content="Origin not allowed")
        
        response = await call_next(request)
        
        # Add CORS headers to response
        if origin and is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept"
            response.headers["Access-Control-Expose-Headers"] = "Content-Type, Authorization"
        
        return response

app.add_middleware(DynamicCORSMiddleware)
app.add_middleware(RateLimitMiddleware, calls=50, period=60.0)
app.add_middleware(ErrorHandlingMiddleware)

# Note: Database tables are managed by Alembic migrations
# Run: alembic upgrade head

# Mount Auth router
app.include_router(auth_router, prefix="", tags=["auth"])

# Mount Projects router
from .routers import projects_router
app.include_router(projects_router, prefix="/api")

# Mount Costs router (UNIQUE FEATURE #1!)
from .routers.costs import router as costs_router
app.include_router(costs_router, prefix="/api")

# Initialize Deploy Engines
deploy_engine = DeployEngine()  # Legacy local Docker deployment
k8s_deploy_engine = K8sDeployEngine()  # New Kubernetes deployment for production

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
    # Start deployment in background
    background_tasks.add_task(
        run_deployment,
        str(deploy.id),
        payload.repo,
        payload.branch,
        current_user.github_token
    )
    
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
    
    return {"deploy_id": str(deploy.id), "status": "queued"}


async def run_deployment(deploy_id: str, repo: str, branch: str, github_token: str = None):
    """Background task to run actual deployment using Kubernetes deploy engine"""
    async with AsyncSessionLocal() as session:
        deploy = await crud.get_deploy(session, deploy_id)
        if not deploy:
            return

        try:
            # Update status to running
            deploy.status = "running"
            await session.commit()
            
            # Log: Starting deployment
            await crud.append_log(session, deploy, f"🚀 Starting deployment of {repo} ({branch})...")
            await crud.append_log(session, deploy, "📦 Cloning repository...")
            await crud.append_log(session, deploy, "🔨 Building Docker image...")
            await crud.append_log(session, deploy, "☁️  Pushing to AWS ECR...")
            await crud.append_log(session, deploy, "🚀 Deploying to Kubernetes...")
            
            # Run Kubernetes deployment
            success, deploy_info, message = await k8s_deploy_engine.build_and_deploy(
                repo_url=repo,
                branch=branch,
                deploy_id=deploy_id,
                user_id=str(deploy.user_id)
            )
            
            if success:
                # Update deployment with success info
                deploy.status = "success"
                deploy.url = deploy_info.get("url")
                deploy.container_id = deploy_info.get("app_name")  # Store app name
                deploy.port = 80  # LoadBalancer port
                
                await crud.append_log(session, deploy, f"✅ Deployment successful!")
                await crud.append_log(session, deploy, f"🌐 Live URL: {deploy_info.get('url')}")
                await crud.append_log(session, deploy, f"📦 App Name: {deploy_info.get('app_name')}")
                await crud.append_log(session, deploy, f"🐳 Image: {deploy_info.get('image')}")
                await crud.append_log(session, deploy, f"📊 Project Type: {deploy_info.get('project_type')}")
                await crud.append_log(session, deploy, f"🎯 Namespace: {deploy_info.get('namespace')}")
                await crud.append_log(session, deploy, "")
                await crud.append_log(session, deploy, "✨ DevOps Features Active:")
                await crud.append_log(session, deploy, "  ✅ Auto-scaling (2-10 replicas)")
                await crud.append_log(session, deploy, "  ✅ Self-healing (health checks)")
                await crud.append_log(session, deploy, "  ✅ Load balancing (AWS ELB)")
                await crud.append_log(session, deploy, "  ✅ High availability (multi-replica)")
                await crud.append_log(session, deploy, "  ✅ Zero-downtime deployments")
            else:
                # Update deployment with failure info
                deploy.status = "failed"
                deploy.error_message = message
                await crud.append_log(session, deploy, f"❌ Deployment failed: {message}")
            
            await session.commit()
            
        except Exception as e:
            # Handle unexpected errors
            deploy.status = "failed"
            deploy.error_message = str(e)
            await crud.append_log(session, deploy, f"❌ Unexpected error: {str(e)}")
            await session.commit()

@app.get("/deployments")
async def list_deploys(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
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
    except Exception as e:
        print(f"⚠️ Error fetching deployments: {e}")
        # Return empty list instead of error
        return {"deployments": []}


@app.delete("/deployments/{deploy_id}")
async def delete_deployment(
    deploy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a deployment from Kubernetes and database"""
    try:
        # Get deployment
        deploy = await crud.get_deploy(db, deploy_id)
        if not deploy:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        # Check ownership
        if deploy.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Delete from Kubernetes if app_name exists
        if deploy.container_id:  # container_id stores app_name
            success, message = await k8s_deploy_engine.delete_deployment(deploy.container_id)
            if not success:
                raise HTTPException(status_code=500, detail=message)
        
        # Delete from database
        await db.delete(deploy)
        await db.commit()
        
        return {"message": "Deployment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/deployments/{deploy_id}/logs")
async def get_deployment_logs(
    deploy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get live logs from Kubernetes deployment"""
    try:
        # Get deployment
        deploy = await crud.get_deploy(db, deploy_id)
        if not deploy:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        # Check ownership
        if deploy.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get logs from Kubernetes
        if deploy.container_id:  # container_id stores app_name
            logs = await k8s_deploy_engine.get_deployment_logs(deploy.container_id)
            return {"logs": logs}
        
        # Fallback to stored logs
        return {"logs": deploy.logs or "No logs available"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/deployments/trigger")
async def trigger_cloud_deployment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Trigger cloud deployment via Jenkins CI/CD"""
    from .deploy_engine import JenkinsDeployEngine
    
    try:
        body = await request.json()
        repo = body.get("repo", "autostack")
        branch = body.get("branch", "main")
        target = body.get("target", "both")  # frontend, backend, or both
        
        # Validate target
        if target not in ["frontend", "backend", "both"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target. Must be 'frontend', 'backend', or 'both'"
            )
        
        # Initialize Jenkins engine
        jenkins_engine = JenkinsDeployEngine()
        
        # Trigger Jenkins job
        success, job_info, error = await jenkins_engine.trigger_jenkins_job(
            repo=repo,
            branch=branch,
            target=target
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to trigger deployment: {error}"
            )
        
        return {
            "queued": job_info.get("queued", True),
            "jenkins_build_url": job_info.get("build_url", job_info.get("queue_url")),
            "build_number": job_info.get("build_number"),
            "job_name": job_info.get("job_name"),
            "params": job_info.get("params"),
            "message": "Deployment triggered successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error triggering deployment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger deployment: {str(e)}"
        )

@app.get("/deployments/status")
async def get_deployment_status(
    build_url: str = None,
    build_number: int = None,
    current_user: models.User = Depends(get_current_user)
):
    """Get cloud deployment status from Jenkins"""
    from .deploy_engine import JenkinsDeployEngine
    
    try:
        if not build_url and not build_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either build_url or build_number must be provided"
            )
        
        # Initialize Jenkins engine
        jenkins_engine = JenkinsDeployEngine()
        
        # Get build status
        success, status_info, error = await jenkins_engine.get_build_status(
            build_url=build_url,
            build_number=build_number
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get deployment status: {error}"
            )
        
        return {
            "status": status_info.get("status"),
            "building": status_info.get("building"),
            "result": status_info.get("result"),
            "url": status_info.get("url"),
            "number": status_info.get("number"),
            "duration": status_info.get("duration"),
            "timestamp": status_info.get("timestamp")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error getting deployment status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deployment status: {str(e)}"
        )

@app.get("/github/repos")
async def list_github_repos(
    current_user: models.User = Depends(get_current_user)
):
    """List user's GitHub repositories"""
    if not current_user.github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account not connected. Please connect your GitHub account first."
        )
    
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"Bearer {current_user.github_token}",
                    "Accept": "application/json"
                },
                params={"per_page": 100, "sort": "updated"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to fetch GitHub repositories"
                )
            
            repos = response.json()
            return {
                "repos": [
                    {
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "clone_url": repo["clone_url"],
                        "default_branch": repo["default_branch"],
                        "description": repo["description"],
                        "private": repo["private"],
                        "updated_at": repo["updated_at"]
                    }
                    for repo in repos
                ]
            }
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub API error: {str(e)}"
        )


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
        "environment": deploy.environment,
        "status": deploy.status,
        "logs": deploy.logs or "",
        "url": deploy.url,
        "port": deploy.port,
        "container_id": deploy.container_id,
        "error_message": deploy.error_message,
        "created_at": deploy.created_at.isoformat() if deploy.created_at else None,
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
    try:
        overview = await crud.get_metrics_overview(db, current_user)
        return overview
    except Exception as e:
        print(f"⚠️ Error fetching metrics overview: {e}")
        # Return default metrics instead of error
        return MetricsOverview(
            total_cpu_usage=0.0,
            total_memory_usage=0.0,
            uptime_percentage=0.0,
            active_agents=0,
            total_agents=0
        )


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


# ========================
# Startup Event - Auto-fix Database Schema
# ========================

@app.on_event("startup")
async def startup_fix_database():
    """Auto-fix database schema issues on startup"""
    try:
        print("Checking database schema...")
        async with AsyncSessionLocal() as session:
            # Fix refresh_tokens table - rename token to token_hash if needed
            try:
                result = await session.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='refresh_tokens' AND column_name='token'
                """))
                if result.fetchone():
                    print("Fixing refresh_tokens table...")
                    await session.execute(text("ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash"))
                    await session.execute(text("ALTER INDEX IF EXISTS ix_refresh_tokens_token RENAME TO ix_refresh_tokens_token_hash"))
                    await session.commit()
                    print("Fixed refresh_tokens.token -> token_hash")
                else:
                    print("refresh_tokens schema OK")
            except Exception as e:
                print(f"⚠️  refresh_tokens fix: {e}")
                await session.rollback()
            
            # Fix audit_logs table - convert details to JSON if needed
            try:
                result = await session.execute(text("""
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_name='audit_logs' AND column_name='details'
                """))
                row = result.fetchone()
                if row and row[0] == 'text':
                    print("Fixing audit_logs table...")
                    await session.execute(text("UPDATE audit_logs SET details = '{}' WHERE details IS NULL OR details = ''"))
                    await session.execute(text("ALTER TABLE audit_logs ALTER COLUMN details TYPE json USING COALESCE(details::json, '{}'::json)"))
                    await session.commit()
                    print("Fixed audit_logs.details -> JSON")
                else:
                    print("audit_logs schema OK")
            except Exception as e:
                print(f"⚠️  audit_logs fix: {e}")
                await session.rollback()
        
        print("Database schema check complete")
    except Exception as e:
        print(f"❌ Database schema fix error: {e}")



# Test deployment at 2025-11-10 16:25:30
