# 🛠️ AutoStack Setup Guide

Complete setup instructions for development and production environments.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [GitHub OAuth Configuration](#github-oauth-configuration)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**
- **Node.js** (v20+) - for local development only
- **Python** (v3.12+) - for local development only

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git
cd auto-stack-deploy
```

### 2. Configure Environment Variables

#### Backend Configuration

Create `/autostack-backend/.env`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://autostack:autostack@db:5432/autostack

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# GitHub OAuth (optional for local dev)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

Create `/autostack-frontend/.env.local`:

```bash
# API URL (use backend:8000 for Docker, localhost:8000 for local dev)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=false
```

### 3. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

The database is automatically initialized on first run via Alembic migrations.

To manually run migrations:

```bash
docker exec -it autostack-backend alembic upgrade head
```

### 5. Create Test User

```bash
curl -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "name": "Test User"
  }'
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

---

## GitHub OAuth Configuration

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: AutoStack Local
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:8000/auth/github/callback
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Update Backend Environment

Add to `/autostack-backend/.env`:

```bash
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback
```

### 3. Restart Backend

```bash
docker-compose restart backend
```

### 4. Test GitHub OAuth

1. Go to http://localhost:3000/deploy
2. Click "Connect GitHub Account"
3. Authorize on GitHub
4. You should be redirected back with your repos available

---

## Production Deployment

### Option 1: AWS Deployment

#### Prerequisites

- AWS Account
- AWS CLI configured
- Domain name (optional)

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 instance
# Instance type: t3.medium or larger
# Security groups: Allow ports 80, 443, 22
```

#### 2. Install Docker

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 3. Clone and Configure

```bash
# Clone repository
git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git
cd auto-stack-deploy

# Create production environment files
cp autostack-backend/.env.example autostack-backend/.env
cp autostack-frontend/.env.example autostack-frontend/.env.local

# Edit with production values
nano autostack-backend/.env
nano autostack-frontend/.env.local
```

#### 4. Update docker-compose.yml for Production

```yaml
# Change frontend API URL to your domain
frontend:
  build:
    args:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
  environment:
    NEXT_PUBLIC_API_URL: https://api.yourdomain.com
```

#### 5. Start Services

```bash
docker-compose up -d
```

#### 6. Configure NGINX (Optional)

```bash
# Install NGINX
sudo apt update
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/autostack
```

Add this configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autostack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured automatically
```

#### 8. Configure GitHub OAuth for Production

1. Create new OAuth App on GitHub
2. Use production URLs:
   - Homepage: https://yourdomain.com
   - Callback: https://api.yourdomain.com/auth/github/callback
3. Update `.env` with production credentials
4. Restart services: `docker-compose restart`

---

### Option 2: DigitalOcean Deployment

#### 1. Create Droplet

- Choose Ubuntu 22.04
- Select plan (2GB RAM minimum)
- Add SSH key
- Create droplet

#### 2. Follow AWS Steps 2-8

The process is identical to AWS deployment.

---

### Option 3: Docker Swarm (Multi-node)

#### 1. Initialize Swarm

```bash
# On manager node
docker swarm init --advertise-addr <MANAGER-IP>

# On worker nodes (use token from init output)
docker swarm join --token <TOKEN> <MANAGER-IP>:2377
```

#### 2. Create Stack File

Create `docker-stack.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: autostack
      POSTGRES_PASSWORD: autostack
      POSTGRES_DB: autostack
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  backend:
    image: your-registry/autostack-backend:latest
    environment:
      DATABASE_URL: postgresql+asyncpg://autostack:autostack@db:5432/autostack
    ports:
      - "8000:8000"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  frontend:
    image: your-registry/autostack-frontend:latest
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    ports:
      - "3000:3000"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

volumes:
  postgres_data:
```

#### 3. Deploy Stack

```bash
docker stack deploy -c docker-stack.yml autostack
```

---

## Database Management

### Backup Database

```bash
# Create backup
docker exec autostack-db pg_dump -U autostack autostack > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
gunzip backup_20250108.sql.gz
docker exec -i autostack-db psql -U autostack autostack < backup_20250108.sql
```

### Automated Backups

Create `/etc/cron.daily/autostack-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/autostack"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker exec autostack-db pg_dump -U autostack autostack | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
sudo chmod +x /etc/cron.daily/autostack-backup
```

---

## Monitoring Setup

### Configure Prometheus Alerts

Create `/monitoring/alerts.yml`:

```yaml
groups:
  - name: autostack_alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
        annotations:
          summary: "High CPU usage detected"
          
      - alert: HighMemoryUsage
        expr: memory_usage > 80
        for: 5m
        annotations:
          summary: "High memory usage detected"
          
      - alert: DeploymentFailed
        expr: deployment_status == "failed"
        annotations:
          summary: "Deployment failed"
```

### Configure Grafana Dashboards

1. Access Grafana: http://localhost:3001
2. Login: admin/admin
3. Add Prometheus data source:
   - URL: http://prometheus:9090
4. Import dashboards from `/monitoring/grafana/dashboards/`

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker logs autostack-db

# Test connection
docker exec -it autostack-db psql -U autostack -d autostack -c "SELECT 1;"
```

### Frontend Can't Reach Backend

**Problem**: Console shows connection errors

**Solution**:

1. Check `NEXT_PUBLIC_API_URL` in frontend environment
2. For Docker: Use `http://backend:8000`
3. For local dev: Use `http://localhost:8000`
4. Rebuild: `docker-compose up --build -d`

### Port Conflicts

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>

# Or stop all Docker containers
docker stop $(docker ps -q)
```

### Clean Restart

```bash
# Stop and remove everything
docker-compose down -v

# Remove all Docker resources
docker system prune -af --volumes

# Start fresh
docker-compose up --build -d
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase Docker resources (Docker Desktop)
# Settings -> Resources -> Increase CPU/Memory

# Check database performance
docker exec -it autostack-db psql -U autostack -d autostack -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active'
  ORDER BY duration DESC;
"
```

---

## Security Checklist

### Production Security

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment secrets management
- [ ] Enable database backups
- [ ] Set up monitoring alerts
- [ ] Update dependencies regularly
- [ ] Use non-root Docker user
- [ ] Scan images for vulnerabilities

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Run migrations
docker exec -it autostack-backend alembic upgrade head
```

### Update Dependencies

#### Backend

```bash
# Update Python packages
docker exec -it autostack-backend pip install --upgrade -r requirements.txt
```

#### Frontend

```bash
# Update npm packages
docker exec -it autostack-frontend npm update
```

### Monitor Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

---

## Support

If you encounter issues not covered here:

1. Check [GitHub Issues](https://github.com/Raj-glitch-max/auto-stack-deploy/issues)
2. Review Docker logs: `docker-compose logs`
3. Check system resources: `docker stats`
4. Verify environment variables
5. Try clean restart (see Troubleshooting section)

---

**For additional help, contact: pdinkar821@gmail.com**
