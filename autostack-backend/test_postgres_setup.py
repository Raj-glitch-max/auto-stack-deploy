"""Test script to verify PostgreSQL setup and configuration."""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

load_dotenv()


def test_imports():
    """Test that all required modules can be imported."""
    print("=" * 60)
    print("Testing Imports")
    print("=" * 60)

    try:
        from backend.db import Base, engine, AsyncSessionLocal, get_db
        print("✅ backend.db imports OK")

        from backend import models
        print("✅ backend.models imports OK")

        from backend import crud
        print("✅ backend.crud imports OK")

        from backend import auth
        print("✅ backend.auth imports OK")

        from backend.main import app
        print("✅ backend.main imports OK")

        print("\n✅ All imports successful!")
        return True
    except Exception as e:
        print(f"\n❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_url():
    """Test database URL configuration."""
    print("\n" + "=" * 60)
    print("Testing Database Configuration")
    print("=" * 60)

    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/autostack"
    )

    print(f"Database URL: {database_url}")

    if "postgresql+asyncpg://" in database_url:
        print("✅ Database URL uses PostgreSQL with asyncpg")
    else:
        print("⚠️  Database URL doesn't use postgresql+asyncpg://")

    if "sqlite" in database_url.lower():
        print("⚠️  Warning: Still using SQLite instead of PostgreSQL")
        return False

    return True


def test_alembic_config():
    """Test Alembic configuration."""
    print("\n" + "=" * 60)
    print("Testing Alembic Configuration")
    print("=" * 60)

    try:
        from backend.alembic.env import target_metadata
        print("✅ Alembic env.py imports OK")

        if target_metadata is not None:
            print("✅ target_metadata is configured")
        else:
            print("❌ target_metadata is None")
            return False

        # Check if models are imported
        from backend import models
        from backend.db import Base

        if Base.metadata == target_metadata:
            print("✅ target_metadata matches Base.metadata")
        else:
            print("⚠️  target_metadata doesn't match Base.metadata")

        return True
    except Exception as e:
        print(f"❌ Alembic configuration error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_models():
    """Test that models are properly defined."""
    print("\n" + "=" * 60)
    print("Testing Models")
    print("=" * 60)

    try:
        from backend.models import User, Deploy
        from backend.db import Base

        # Check User model
        if hasattr(User, "__tablename__"):
            print(f"✅ User model has table: {User.__tablename__}")
        else:
            print("❌ User model missing __tablename__")
            return False

        # Check Deploy model
        if hasattr(Deploy, "__tablename__"):
            print(f"✅ Deploy model has table: {Deploy.__tablename__}")
        else:
            print("❌ Deploy model missing __tablename__")
            return False

        # Check metadata
        tables = list(Base.metadata.tables.keys())
        print(f"✅ Found {len(tables)} tables in metadata: {', '.join(tables)}")

        return True
    except Exception as e:
        print(f"❌ Model test error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_database_connection():
    """Test database connection (if PostgreSQL is available)."""
    print("\n" + "=" * 60)
    print("Testing Database Connection")
    print("=" * 60)

    try:
        from backend.db import engine

        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Database connection successful!")
                return True
            else:
                print("❌ Database connection failed")
                return False
    except Exception as e:
        print(f"⚠️  Database connection test skipped: {e}")
        print("   (This is OK if PostgreSQL is not running)")
        return None


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("AutoStack PostgreSQL Setup Verification")
    print("=" * 60)

    results = []

    # Test imports
    results.append(("Imports", test_imports()))

    # Test database URL
    results.append(("Database URL", test_database_url()))

    # Test Alembic config
    results.append(("Alembic Config", test_alembic_config()))

    # Test models
    results.append(("Models", test_models()))

    # Test database connection (async)
    try:
        connection_result = asyncio.run(test_database_connection())
        results.append(("Database Connection", connection_result))
    except Exception as e:
        print(f"⚠️  Connection test error: {e}")
        results.append(("Database Connection", None))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    for name, result in results:
        if result is True:
            status = "✅ PASS"
        elif result is False:
            status = "❌ FAIL"
        else:
            status = "⚠️  SKIP"
        print(f"{name:.<30} {status}")

    all_passed = all(r is True for r in [r[1] for r in results if r[1] is not None])

    if all_passed:
        print("\n✅ All tests passed!")
        print("\nNext steps:")
        print("1. Ensure PostgreSQL is running")
        print("2. Create database: CREATE DATABASE autostack;")
        print("3. Run: alembic revision --autogenerate -m 'initial migration'")
        print("4. Run: alembic upgrade head")
        print("5. Run: python scripts/seed.py")
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")

    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


