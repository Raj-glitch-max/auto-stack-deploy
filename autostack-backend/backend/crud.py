# crud.py
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models


async def create_user(db: AsyncSession, *, email: str, password_hash: str) -> models.User:
    """Persist a new user with a pre-hashed password."""

    user = models.User(email=email, password_hash=password_hash)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> models.User | None:
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: str) -> models.User | None:
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()


async def create_deploy(
    db: AsyncSession,
    *,
    user: models.User,
    deploy_id: str,
    repo: str,
    branch: str,
    environment: str,
) -> models.Deploy:
    deploy = models.Deploy(
        id=deploy_id,
        user_id=user.id,
        repo=repo,
        branch=branch,
        environment=environment,
        status="queued",
        logs="",
    )
    db.add(deploy)
    await db.commit()
    await db.refresh(deploy)
    return deploy


async def list_user_deploys(db: AsyncSession, user: models.User) -> Sequence[models.Deploy]:
    result = await db.execute(
        select(models.Deploy)
        .where(models.Deploy.user_id == user.id)
        .order_by(models.Deploy.created_at.desc())
    )
    return result.scalars().all()


async def get_deploy(db: AsyncSession, deploy_id: str) -> models.Deploy | None:
    result = await db.execute(select(models.Deploy).where(models.Deploy.id == deploy_id))
    return result.scalars().first()


async def append_log(db: AsyncSession, deploy: models.Deploy, text: str) -> models.Deploy:
    deploy.logs = (deploy.logs or "") + text + "\n"
    await db.commit()
    await db.refresh(deploy)
    return deploy


# ========================
# Agent CRUD
# ========================


async def create_agent(
    db: AsyncSession,
    *,
    user: models.User,
    name: str,
    host: str,
    ip: str,
) -> models.Agent:
    agent = models.Agent(
        user_id=user.id,
        name=name,
        host=host,
        ip=ip,
        status="online",
        last_heartbeat=datetime.now(timezone.utc),
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def get_agent(db: AsyncSession, agent_id: str) -> models.Agent | None:
    result = await db.execute(select(models.Agent).where(models.Agent.id == agent_id))
    return result.scalars().first()


async def list_user_agents(db: AsyncSession, user: models.User) -> Sequence[models.Agent]:
    result = await db.execute(
        select(models.Agent)
        .where(models.Agent.user_id == user.id)
        .order_by(models.Agent.created_at.desc())
    )
    return result.scalars().all()


async def update_agent_heartbeat(
    db: AsyncSession,
    agent: models.Agent,
    cpu_usage: float,
    memory_usage: float,
) -> models.Agent:
    agent.cpu_usage = cpu_usage
    agent.memory_usage = memory_usage
    agent.last_heartbeat = datetime.now(timezone.utc)
    agent.status = "online"
    await db.commit()
    await db.refresh(agent)
    return agent


async def mark_agent_offline(db: AsyncSession, agent: models.Agent) -> models.Agent:
    agent.status = "offline"
    await db.commit()
    await db.refresh(agent)
    return agent


# ========================
# Alert CRUD
# ========================


async def create_alert(
    db: AsyncSession,
    *,
    user: models.User,
    severity: str,
    source: str,
    message: str,
    webhook_url: str | None = None,
) -> models.Alert:
    alert = models.Alert(
        user_id=user.id,
        severity=severity,
        source=source,
        message=message,
        webhook_url=webhook_url,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def get_alert(db: AsyncSession, alert_id: str) -> models.Alert | None:
    result = await db.execute(select(models.Alert).where(models.Alert.id == alert_id))
    return result.scalars().first()


async def list_user_alerts(
    db: AsyncSession, user: models.User, resolved: bool | None = None
) -> Sequence[models.Alert]:
    query = select(models.Alert).where(models.Alert.user_id == user.id)
    if resolved is not None:
        query = query.where(models.Alert.resolved == resolved)
    query = query.order_by(models.Alert.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_alert(
    db: AsyncSession,
    alert: models.Alert,
    resolved: bool | None = None,
    webhook_url: str | None = None,
) -> models.Alert:
    if resolved is not None:
        alert.resolved = resolved
    if webhook_url is not None:
        alert.webhook_url = webhook_url
    await db.commit()
    await db.refresh(alert)
    return alert


async def delete_alert(db: AsyncSession, alert: models.Alert) -> None:
    await db.delete(alert)
    await db.commit()


# ========================
# Metrics CRUD
# ========================


async def create_metric(
    db: AsyncSession,
    *,
    user: models.User,
    agent_id: str | None,
    cpu_usage: float,
    memory_usage: float,
    disk_usage: float | None = None,
    network_in: float | None = None,
    network_out: float | None = None,
) -> models.Metrics:
    metric = models.Metrics(
        user_id=user.id,
        agent_id=agent_id,
        cpu_usage=cpu_usage,
        memory_usage=memory_usage,
        disk_usage=disk_usage,
        network_in=network_in,
        network_out=network_out,
    )
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


async def get_metrics_overview(db: AsyncSession, user: models.User) -> dict:
    """Calculate metrics overview for a user."""
    # Get all user agents
    agents = await list_user_agents(db, user)
    total_agents = len(agents)
    active_agents = sum(1 for a in agents if a.status == "online")

    # Calculate average CPU and memory
    total_cpu = sum(a.cpu_usage for a in agents if a.status == "online")
    total_memory = sum(a.memory_usage for a in agents if a.status == "online")
    avg_cpu = total_cpu / active_agents if active_agents > 0 else 0.0
    avg_memory = total_memory / active_agents if active_agents > 0 else 0.0

    # Calculate uptime percentage (agents that sent heartbeat in last 5 minutes)
    five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    five_min_ago_naive = five_min_ago.replace(tzinfo=None)  # Make naive for comparison
    online_count = sum(
        1
        for a in agents
        if a.last_heartbeat and a.last_heartbeat > five_min_ago_naive
    )
    uptime_percentage = (online_count / total_agents * 100) if total_agents > 0 else 0.0

    return {
        "total_cpu_usage": round(avg_cpu, 2),
        "total_memory_usage": round(avg_memory, 2),
        "uptime_percentage": round(uptime_percentage, 2),
        "active_agents": active_agents,
        "total_agents": total_agents,
    }


# ========================
# Audit Log CRUD
# ========================


async def create_audit_log(
    db: AsyncSession,
    *,
    user: models.User,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: str | dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> models.AuditLog:
    """Create an audit log entry.
    
    Args:
        details: Can be a string, dict, or None. If string, it will be converted to {"message": string}.
                 If None, defaults to empty dict {}.
    """
    # Convert details to proper JSON format
    if details is None:
        json_details = {}
    elif isinstance(details, str):
        json_details = {"message": details}
    elif isinstance(details, dict):
        json_details = details
    else:
        json_details = {"value": str(details)}
    
    audit_log = models.AuditLog(
        user_id=user.id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json_details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(audit_log)
    return audit_log


async def list_user_audit_logs(
    db: AsyncSession, user: models.User, limit: int = 100
) -> Sequence[models.AuditLog]:
    result = await db.execute(
        select(models.AuditLog)
        .where(models.AuditLog.user_id == user.id)
        .order_by(models.AuditLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ========================
# API Key CRUD
# ========================


async def create_api_key(
    db: AsyncSession, *, user: models.User, name: str, key_hash: str
) -> models.APIKey:
    api_key = models.APIKey(user_id=user.id, name=name, key_hash=key_hash)
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return api_key


async def get_api_key_by_hash(
    db: AsyncSession, key_hash: str
) -> models.APIKey | None:
    result = await db.execute(
        select(models.APIKey).where(models.APIKey.key_hash == key_hash)
    )
    return result.scalars().first()


async def list_user_api_keys(db: AsyncSession, user: models.User) -> Sequence[models.APIKey]:
    result = await db.execute(
        select(models.APIKey)
        .where(models.APIKey.user_id == user.id)
        .order_by(models.APIKey.created_at.desc())
    )
    return result.scalars().all()


async def delete_api_key(db: AsyncSession, api_key: models.APIKey) -> None:
    await db.delete(api_key)
    await db.commit()


async def update_api_key_last_used(
    db: AsyncSession, api_key: models.APIKey
) -> models.APIKey:
    api_key.last_used = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(api_key)
    return api_key


# ========================
# Refresh Token CRUD
# ========================


async def create_refresh_token(
    db: AsyncSession,
    *,
    user: models.User,
    token_hash: str,
    expires_at: datetime,
) -> models.RefreshToken:
    refresh_token = models.RefreshToken(
        user_id=user.id, token_hash=token_hash, expires_at=expires_at
    )
    db.add(refresh_token)
    await db.commit()
    await db.refresh(refresh_token)
    return refresh_token


async def get_refresh_token_by_hash(
    db: AsyncSession, token_hash: str
) -> models.RefreshToken | None:
    result = await db.execute(
        select(models.RefreshToken).where(models.RefreshToken.token_hash == token_hash)
    )
    return result.scalars().first()


async def delete_refresh_token(db: AsyncSession, refresh_token: models.RefreshToken) -> None:
    await db.delete(refresh_token)
    await db.commit()


async def cleanup_expired_refresh_tokens(db: AsyncSession) -> int:
    """Delete expired refresh tokens. Returns count of deleted tokens."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(models.RefreshToken).where(models.RefreshToken.expires_at < now)
    )
    expired_tokens = result.scalars().all()
    count = len(expired_tokens)
    for token in expired_tokens:
        await db.delete(token)
    await db.commit()
    return count

