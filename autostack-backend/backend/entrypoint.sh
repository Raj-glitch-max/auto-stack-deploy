#!/bin/bash

set -e

echo "Running Alembic migration..."
cd /app
alembic upgrade head || echo "Alembic migration failed or already applied"

echo "Starting Autostack API...."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
