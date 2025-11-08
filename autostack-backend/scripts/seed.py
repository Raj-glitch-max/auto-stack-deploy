"""Seed script to populate database with test data."""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

from backend.db import AsyncSessionLocal, Base, engine
from backend import crud, models
from backend.auth import hash_password

load_dotenv()


async def seed_database():
    """Seed the database with test data."""
    print("=" * 60)
    print("Seeding AutoStack Database")
    print("=" * 60)

    # Create tables if they don't exist
    print("\n1. Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("   ✅ Tables created")

    # Create test user
    print("\n2. Creating test user...")
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        existing_user = await crud.get_user_by_email(db, "test@example.com")
        if existing_user:
            print("   ⚠️  Test user already exists, skipping...")
            user = existing_user
        else:
            password_hash = hash_password("testpass123")
            user = await crud.create_user(
                db,
                email="test@example.com",
                password_hash=password_hash,
            )
            print(f"   ✅ Test user created: {user.email} (ID: {user.id})")

        # Create test deployment
        print("\n3. Creating test deployment...")
        existing_deployments = await crud.list_user_deploys(db, user)
        if existing_deployments:
            print(f"   ⚠️  User already has {len(existing_deployments)} deployment(s), skipping...")
        else:
            import uuid

            deploy = await crud.create_deploy(
                db,
                user=user,
                deploy_id=str(uuid.uuid4()),
                repo="https://github.com/example/repo",
                branch="main",
                environment="production",
            )
            print(f"   ✅ Test deployment created: {deploy.id}")
            print(f"      Repo: {deploy.repo}")
            print(f"      Branch: {deploy.branch}")
            print(f"      Environment: {deploy.environment}")
            print(f"      Status: {deploy.status}")

        # Create test agents
        print("\n4. Creating test agents...")
        existing_agents = await crud.list_user_agents(db, user)
        if existing_agents:
            print(f"   ⚠️  User already has {len(existing_agents)} agent(s), skipping...")
        else:
            import uuid
            from datetime import datetime, timezone

            agents_data = [
                {"name": "Agent-01", "host": "prod-server-01", "ip": "192.168.1.101", "cpu": 45.0, "memory": 62.0},
                {"name": "Agent-02", "host": "prod-server-02", "ip": "192.168.1.102", "cpu": 38.0, "memory": 55.0},
                {"name": "Agent-03", "host": "staging-server", "ip": "192.168.1.103", "cpu": 28.0, "memory": 42.0},
            ]
            for agent_data in agents_data:
                agent = await crud.create_agent(
                    db,
                    user=user,
                    name=agent_data["name"],
                    host=agent_data["host"],
                    ip=agent_data["ip"],
                )
                # Update with metrics
                agent = await crud.update_agent_heartbeat(
                    db, agent, agent_data["cpu"], agent_data["memory"]
                )
                print(f"   ✅ Agent created: {agent.name} ({agent.host})")

        # Create test alerts
        print("\n5. Creating test alerts...")
        existing_alerts = await crud.list_user_alerts(db, user)
        if existing_alerts:
            print(f"   ⚠️  User already has {len(existing_alerts)} alert(s), skipping...")
        else:
            alerts_data = [
                {"severity": "critical", "source": "api-gateway", "message": "High CPU usage detected (92% for 5 minutes)"},
                {"severity": "warning", "source": "database-service", "message": "Memory usage above threshold (78%)"},
                {"severity": "warning", "source": "cache-service", "message": "Connection pool utilization high"},
                {"severity": "info", "source": "web-frontend", "message": "Deployment completed successfully"},
            ]
            for alert_data in alerts_data:
                alert = await crud.create_alert(
                    db,
                    user=user,
                    severity=alert_data["severity"],
                    source=alert_data["source"],
                    message=alert_data["message"],
                )
                print(f"   ✅ Alert created: {alert.severity} - {alert.source}")

        # Create test API key
        print("\n6. Creating test API key...")
        existing_api_keys = await crud.list_user_api_keys(db, user)
        if existing_api_keys:
            print(f"   ⚠️  User already has {len(existing_api_keys)} API key(s), skipping...")
        else:
            import secrets
            from backend.auth import hash_token

            api_key = f"ask_{secrets.token_urlsafe(32)}"
            key_hash = hash_token(api_key)
            api_key_obj = await crud.create_api_key(db, user=user, name="Test API Key", key_hash=key_hash)
            print(f"   ✅ API key created: {api_key_obj.name}")
            print(f"      Key: {api_key}")

        # Create audit log for signup
        print("\n7. Creating audit logs...")
        await crud.create_audit_log(
            db,
            user=user,
            action="signup",
            resource_type="user",
            resource_id=str(user.id),
            details="User signed up via seed script",
        )
        print("   ✅ Audit log created")

    print("\n" + "=" * 60)
    print("✅ Database seeding completed!")
    print("=" * 60)
    print("\nTest credentials:")
    print("  Email: test@example.com")
    print("  Password: testpass123")


if __name__ == "__main__":
    try:
        asyncio.run(seed_database())
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


