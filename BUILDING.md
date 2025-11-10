# 🔨 Building & Testing Guide

Complete guide for building, testing, and running AutoStack locally.

---

## 📋 Prerequisites

### **Required Software**
- **Docker** Desktop (v20.10+)
- **Node.js** (v18+) & npm
- **Python** (v3.11+)
- **Git**

### **Optional (for AWS deployment)**
- AWS CLI (v2+)
- kubectl (v1.28+)
- Terraform (v1.5+)
- Helm (v3+)

---

## 🏗️ Building Frontend

### **Install Dependencies**

```bash
cd autostack-frontend

# Install npm packages
npm install

# Or use legacy peer deps if conflicts
npm install --legacy-peer-deps
```

### **Build for Production**

```bash
# Create optimized production build
npm run build

# Output in .next/ folder
```

### **Build Docker Image**

```bash
# From project root
cd autostack-frontend

# Build image
docker build -t autostack-frontend:latest .

# Verify image
docker images | grep autostack-frontend
```

### **Run Locally**

```bash
# Development mode (hot reload)
npm run dev

# Access at http://localhost:3000
```

```bash
# Production mode (Docker)
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  autostack-frontend:latest
```

---

## 🐍 Building Backend

### **Install Dependencies**

```bash
cd autostack-backend/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### **Database Setup**

```bash
# Start PostgreSQL (Docker)
docker run -d \
  --name postgres \
  -e POSTGRES_DB=autostack \
  -e POSTGRES_USER=autostack \
  -e POSTGRES_PASSWORD=autostack_password \
  -p 5432:5432 \
  postgres:15-alpine

# Run migrations
alembic upgrade head
```

### **Build Docker Image**

```bash
# From backend directory
cd autostack-backend/backend

# Build image
docker build -t autostack-backend:latest .

# Verify image
docker images | grep autostack-backend
```

### **Run Locally**

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Access at http://localhost:8000
# API docs at http://localhost:8000/docs
```

```bash
# Production mode (Docker)
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://autostack:autostack_password@host.docker.internal:5432/autostack \
  -e JWT_SECRET=your-secret-key \
  autostack-backend:latest
```

---

## 🧪 Testing

### **Frontend Tests**

```bash
cd autostack-frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### **Backend Tests**

```bash
cd autostack-backend/backend

# Run pytest
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest tests/test_auth.py
```

### **API Testing**

```bash
# Using curl
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Using httpie
http GET localhost:8000/health

# Interactive API docs
# Open http://localhost:8000/docs
```

---

## 🐳 Docker Compose (Full Stack)

### **Start All Services**

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: autostack
      POSTGRES_USER: autostack
      POSTGRES_PASSWORD: autostack_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./autostack-backend/backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://autostack:autostack_password@postgres:5432/autostack
      JWT_SECRET: dev-secret-key
    depends_on:
      - postgres

  frontend:
    build:
      context: ./autostack-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### **Stop Services**

```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🔍 Debugging

### **Frontend Debugging**

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check bundle size
npm run build
npm run analyze

# Clear Next.js cache
rm -rf .next
```

### **Backend Debugging**

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn main:app --reload --log-level debug

# Check database connection
python -c "from database import engine; print(engine)"

# Run migrations check
alembic current
alembic history
```

### **Docker Debugging**

```bash
# View container logs
docker logs autostack-backend
docker logs -f autostack-frontend

# Enter container shell
docker exec -it autostack-backend /bin/bash

# Inspect container
docker inspect autostack-backend

# Check resource usage
docker stats
```

---

## 📦 Build Optimization

### **Frontend Optimization**

```bash
# Analyze bundle
npm run build
npm run analyze

# Optimize images (if needed)
npm install sharp
```

**Next.js Config** (`next.config.js`):
```javascript
module.exports = {
  output: 'standalone',
  compress: true,
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp'],
  },
  swcMinify: true,
}
```

### **Backend Optimization**

**Dockerfile multi-stage build**:
```dockerfile
# Builder stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🚀 Build for Production

### **Frontend Production Build**

```bash
cd autostack-frontend

# Install dependencies
npm ci --only=production --legacy-peer-deps

# Build
npm run build

# Test production build locally
npm start
```

### **Backend Production Build**

```bash
cd autostack-backend/backend

# Install production dependencies only
pip install --no-dev -r requirements.txt

# Run with gunicorn (production ASGI server)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 🔐 Environment Variables

### **Frontend (.env.local)**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### **Backend (.env)**

```bash
DATABASE_URL=postgresql+asyncpg://autostack:autostack_password@localhost:5432/autostack
JWT_SECRET=your-super-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
PORT=8000
```

---

## ✅ Build Checklist

Before deploying:

- [ ] All tests pass
- [ ] No TypeScript/linting errors
- [ ] Docker images build successfully
- [ ] Environment variables configured
- [ ] Database migrations run successfully
- [ ] API health check passes
- [ ] Frontend loads without errors
- [ ] No console errors in browser
- [ ] Dependencies are up to date
- [ ] Security scan passed

---

## 📊 Build Scripts

Create `build-all.sh`:

```bash
#!/bin/bash

echo "🏗️  Building AutoStack..."

# Build frontend
echo "📦 Building frontend..."
cd autostack-frontend
npm ci --legacy-peer-deps
npm run build
docker build -t autostack-frontend:latest .

# Build backend
echo "🐍 Building backend..."
cd ../autostack-backend/backend
docker build -t autostack-backend:latest .

echo "✅ Build complete!"
```

Make executable:
```bash
chmod +x build-all.sh
./build-all.sh
```

---

## 🐛 Common Build Issues

### **Frontend**

**Issue**: `npm ERR! peer dependency conflicts`  
**Fix**: Use `--legacy-peer-deps` flag

**Issue**: `Module not found: Can't resolve 'fs'`  
**Fix**: Add to `next.config.js`:
```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = { fs: false };
  }
  return config;
}
```

### **Backend**

**Issue**: `ModuleNotFoundError: No module named 'psycopg2'`  
**Fix**: Install correct PostgreSQL driver:
```bash
pip install psycopg2-binary
```

**Issue**: `alembic.util.exc.CommandError: Can't locate revision`  
**Fix**: Reset migrations:
```bash
alembic stamp head
alembic upgrade head
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Need help? Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common issues.**
