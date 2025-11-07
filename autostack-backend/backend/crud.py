# crud.py
from sqlalchemy import select
from . import models
from datetime import datetime, timedelta
import uuid

async def create_user(db, email, name, hashed_password):
    user = models.User(email=email, name=name, hashed_password=hashed_password)
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_by_email(db, email):
    q = await db.execute(select(models.User).where(models.User.email == email))
    return q.scalars().first()

async def create_refresh_token(db, user, token_str, expires_at):
    rt = models.RefreshToken(token=token_str, user_id=user.id, expires_at=expires_at)
    db.add(rt)
    await db.flush()
    await db.commit()
    await db.refresh(rt)
    return rt

async def revoke_refresh_token(db, token_str):
    q = await db.execute(select(models.RefreshToken).where(models.RefreshToken.token == token_str))
    rt = q.scalars().first()
    if rt:
        rt.revoked = True
        await db.commit()
    return rt

async def create_deploy(db, user, deploy_id, repo, branch, environment):
    d = models.Deploy(id=deploy_id, user_id=user.id, repo=repo, branch=branch, environment=environment, status="queued", logs="")
    db.add(d)
    await db.flush()
    await db.commit()
    await db.refresh(d)
    return d

async def list_user_deploys(db, user):
    q = await db.execute(select(models.Deploy).where(models.Deploy.user_id == user.id).order_by(models.Deploy.created_at.desc()))
    return q.scalars().all()

async def get_deploy(db, deploy_id):
    q = await db.execute(select(models.Deploy).where(models.Deploy.id == deploy_id))
    return q.scalars().first()

async def append_log(db, deploy: models.Deploy, text: str):
    deploy.logs = (deploy.logs or "") + text + "\n"
    await db.commit()
    await db.refresh(deploy)
    return deploy

