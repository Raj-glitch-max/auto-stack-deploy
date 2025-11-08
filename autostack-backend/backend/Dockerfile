FROM python:3.12-slim

WORKDIR /app

# System dependencies for PostgreSQL and builds
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend /app/backend

# Copy Alembic migration setup (must exist inside backend/)
COPY backend/alembic /app/alembic
COPY backend/alembic.ini /app/alembic.ini

EXPOSE 8000

CMD ["sh", "-c", "cd /app && alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]

