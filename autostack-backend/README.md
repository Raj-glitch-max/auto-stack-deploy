# AutoStack Backend

FastAPI backend for AutoStack DevOps monitoring & deployment dashboard.

## Tech Stack

- **FastAPI** - Modern async web framework
- **SQLAlchemy** (async) - ORM with async support
- **PostgreSQL** - Production database
- **Alembic** - Database migrations
- **JWT Auth** - Token-based authentication with bcrypt
- **Pydantic v2** - Data validation and serialization

## Prerequisites

- Python 3.10+
- PostgreSQL 12+
- pip or poetry

## Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   cd autostack-backend
   pip install -r backend/requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the `autostack-backend` directory:
   ```env
   # Database
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/autostack
   
   # JWT
   SECRET_KEY=your-secret-key-here-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

4. **Create PostgreSQL database**:
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE autostack;
   \q
   ```

## Database Migrations

### Initial Setup

1. **Generate initial migration**:
   ```bash
   cd autostack-backend/backend
   alembic revision --autogenerate -m "initial migration"
   ```

2. **Apply migrations**:
   ```bash
   alembic upgrade head
   ```

### Creating New Migrations

When you modify models:

1. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "description of changes"
   ```

2. **Review the generated migration** in `backend/alembic/versions/`

3. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

### Migration Commands

- `alembic revision --autogenerate -m "message"` - Generate migration from model changes
- `alembic upgrade head` - Apply all pending migrations
- `alembic downgrade -1` - Rollback last migration
- `alembic current` - Show current migration version
- `alembic history` - Show migration history

## Seeding Database

Seed the database with test data:

```bash
cd autostack-backend
python scripts/seed.py
```

This creates:
- Test user: `test@example.com` / `testpass123`
- One test deployment

## Running the Server

```bash
cd autostack-backend
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /signup` - Create new user
- `POST /login` - Authenticate user

### Protected Endpoints (require JWT token)
- `GET /me` - Get current user info
- `POST /logout` - Logout placeholder
- `POST /reset-password` - Password reset stub
- `POST /deploy` - Create deployment
- `GET /deployments` - List user deployments
- `GET /status/{deploy_id}` - Get deployment status

## Testing

### Test Authentication Flow

1. **Signup**:
   ```bash
   curl -X POST http://127.0.0.1:8000/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://127.0.0.1:8000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

3. **Get current user** (use token from login):
   ```bash
   curl -X GET http://127.0.0.1:8000/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Project Structure

```
autostack-backend/
├── backend/
│   ├── alembic/          # Migration scripts
│   │   ├── versions/     # Migration files
│   │   └── env.py        # Alembic configuration
│   ├── alembic.ini        # Alembic config file
│   ├── auth.py           # Authentication logic
│   ├── crud.py            # Database operations
│   ├── db.py              # Database connection
│   ├── main.py            # FastAPI application
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   └── requirements.txt  # Dependencies
├── scripts/
│   └── seed.py            # Database seeding script
└── .env                   # Environment variables (create this)
```

## Development

### Code Style

- Follow PEP 8
- Use type hints
- Async/await for database operations

### Database Changes

1. Modify models in `backend/models.py`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review and test migration
4. Apply: `alembic upgrade head`

## Production Deployment

1. Set strong `SECRET_KEY` in environment
2. Use production PostgreSQL database
3. Set `DATABASE_URL` environment variable
4. Run migrations: `alembic upgrade head`
5. Use production ASGI server (e.g., Gunicorn with Uvicorn workers)

## License

MIT


