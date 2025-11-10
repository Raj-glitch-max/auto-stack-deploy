# ============================================
# STAGE 1: Builder
# ============================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install to a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================
# STAGE 2: Production Runner
# ============================================
FROM python:3.12-slim AS runner

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create backend package directory structure
RUN mkdir -p /app/backend

# Copy backend source code into backend package
COPY *.py /app/backend/
RUN touch /app/backend/__init__.py

# Copy Alembic migration setup
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini

# Create non-root user
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
