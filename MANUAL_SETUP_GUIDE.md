# 🔧 MANUAL SETUP GUIDE FOR AUTOSTACK

This guide covers everything that requires your manual intervention to complete the AutoStack project.

---

## ✅ WHAT I'VE COMPLETED AUTOMATICALLY

I've created and configured:

1. ✅ **Python Agent Client** (`autostack-agent/`)
   - Full monitoring daemon with psutil
   - Auto-registration and heartbeat
   - Systemd service configuration

2. ✅ **Prometheus Configuration** (`prometheus/`)
   - Scraping targets for backend and agents
   - Alert rules for CPU, memory, disk
   - Dynamic service discovery

3. ✅ **Grafana Dashboards** (`grafana/dashboards/`)
   - Pre-built AutoStack overview dashboard
   - CPU, memory, network, disk visualizations

4. ✅ **NGINX Reverse Proxy** (`nginx/`)
   - Complete configuration with rate limiting
   - WebSocket support for live logs
   - Static file caching

5. ✅ **GitHub Actions CI/CD** (`.github/workflows/`)
   - Automated testing on push
   - Docker build and push
   - Deployment automation

6. ✅ **Deploy Engine** (`autostack-backend/backend/deploy_engine.py`)
   - GitHub repo cloning
   - Auto-detect project type
   - Docker build and deployment
   - Port management

7. ✅ **Integration Tests** (`autostack-backend/tests/`)
   - Auth tests
   - Deployment tests
   - Health check tests
   - Pytest configuration

8. ✅ **.env.example Files**
   - Backend configuration template
   - Frontend configuration template

---

## 🚀 WHAT YOU NEED TO DO MANUALLY

### PHASE 1: GitHub OAuth Setup (Required for Deploy Feature)

#### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   ```
   Application name: AutoStack
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:8000/auth/github/callback
   ```
4. Click "Register application"
5. **Save these values:**
   - Client ID
   - Client Secret (click "Generate a new client secret")

#### Step 2: Add to Environment Files

**Backend** (`autostack-backend/.env`):
```bash
cp autostack-backend/.env.example autostack-backend/.env
nano autostack-backend/.env
```

Add your GitHub credentials:
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

**Frontend** (`autostack-frontend/.env.local`):
```bash
# Already exists, just verify:
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

#### Step 3: Implement GitHub OAuth Backend

I need to add this to `autostack-backend/backend/auth.py`:

```python
# Add these imports
from fastapi import HTTPException
from httpx import AsyncClient as HTTPXClient

# Add this endpoint
@router.get("/auth/github")
async def github_login():
    """Redirect to GitHub OAuth"""
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    redirect_uri = os.getenv("GITHUB_CALLBACK_URL")
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={github_client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=repo,user:email"
    )
    
    return {"url": github_auth_url}

@router.get("/auth/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    # Exchange code for access token
    async with HTTPXClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": os.getenv("GITHUB_CLIENT_ID"),
                "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
                "code": code
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_response.json()
        github_token = token_data.get("access_token")
    
    # Get user info from GitHub
    async with HTTPXClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}"}
        )
        github_user = user_response.json()
    
    # Create or update user in database
    user = await crud.get_user_by_email(db, github_user["email"])
    if not user:
        user = await crud.create_user(
            db,
            email=github_user["email"],
            password="github_oauth"  # Placeholder
        )
    
    # Update GitHub token
    user.github_token = github_token
    user.github_username = github_user["login"]
    await db.commit()
    
    # Create JWT tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(user.id, db)
    
    # Redirect to frontend with tokens
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
    )
```

**Tell me when you're ready and I'll help you add this code!**

---

### PHASE 2: Update Docker Compose (Add NGINX)

Edit `docker-compose.yml` to add NGINX:

```yaml
  nginx:
    build: ./nginx
    container_name: autostack-nginx
    ports:
      - "80:80"
    depends_on:
      - autostack-backend
      - autostack-frontend
    networks:
      - default
```

Then rebuild:
```bash
docker-compose up -d --build nginx
```

---

### PHASE 3: Update Prometheus in Docker Compose

Edit `docker-compose.yml` to use our new config:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: autostack-prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - default
```

Restart:
```bash
docker-compose restart prometheus
```

---

### PHASE 4: Setup Grafana Dashboard

1. **Access Grafana**: http://localhost:3001
2. **Login**: admin / admin (change password)
3. **Add Prometheus Data Source**:
   - Go to Configuration → Data Sources
   - Add Prometheus
   - URL: `http://autostack-prometheus:9090`
   - Save & Test

4. **Import Dashboard**:
   - Go to Dashboards → Import
   - Upload `grafana/dashboards/autostack-overview.json`
   - Select Prometheus data source
   - Import

---

### PHASE 5: Install and Test Agent

On your local machine or server:

```bash
cd autostack-agent

# Install dependencies
pip install -r requirements.txt

# Generate API key (in backend)
# You'll need to create an endpoint for this or use database directly

# Set environment variables
export AUTOSTACK_API_KEY="your-api-key-here"
export AUTOSTACK_BACKEND_URL="http://localhost:8000"

# Run agent
python3 agent.py
```

**For production (systemd)**:
```bash
sudo cp agent.py /opt/autostack/agent.py
sudo cp autostack-agent/README.md /opt/autostack/
sudo nano /etc/systemd/system/autostack-agent.service
# (Copy content from agent README)
sudo systemctl enable autostack-agent
sudo systemctl start autostack-agent
```

---

### PHASE 6: Add Deploy Engine to Backend

I need to integrate the deploy engine into `main.py`. Add these imports:

```python
from .deploy_engine import DeployEngine
```

And update the `/deploy` endpoint:

```python
deploy_engine = DeployEngine()

@app.post("/deploy")
async def deploy_endpoint(
    payload: DeployCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deploy_id = str(uuid.uuid4())
    
    # Create deployment record
    deploy = await crud.create_deploy(
        db,
        user=current_user,
        deploy_id=deploy_id,
        repo=payload.repo,
        branch=payload.branch,
        environment=payload.environment,
    )
    
    # Start deployment in background
    background_tasks.add_task(
        run_deployment,
        deploy_id,
        payload.repo,
        payload.branch,
        db
    )
    
    return deploy

async def run_deployment(deploy_id: str, repo: str, branch: str, db: AsyncSession):
    """Background task to run deployment"""
    success, deploy_info, error = await deploy_engine.deploy_from_github(
        repo_url=repo,
        branch=branch,
        deploy_id=deploy_id
    )
    
    # Update deployment in database
    deploy = await crud.get_deploy(db, deploy_id)
    if success:
        deploy.status = "success"
        deploy.port = deploy_info["port"]
        deploy.container_id = deploy_info["container_id"]
        deploy.url = deploy_info["url"]
    else:
        deploy.status = "failed"
        deploy.error_message = error
    
    await db.commit()
```

**Tell me when you're ready and I'll help you integrate this!**

---

### PHASE 7: Frontend GitHub Integration

Add to `autostack-frontend/app/dashboard/page.tsx`:

```typescript
// Add GitHub connect button
const connectGitHub = async () => {
  const response = await api.get('/auth/github')
  window.location.href = response.data.url
}

// Add repo selector component
// Add deploy button that calls /deploy endpoint
```

---

### PHASE 8: AWS Deployment (When Ready)

1. **Launch EC2 Instance**:
   ```bash
   # t3.medium or larger
   # Ubuntu 22.04 LTS
   # Security groups: 22, 80, 443, 8000, 3000
   ```

2. **Install Docker**:
   ```bash
   ssh ubuntu@your-ec2-ip
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   ```

3. **Clone and Deploy**:
   ```bash
   git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git /opt/autostack
   cd /opt/autostack
   cp autostack-backend/.env.example autostack-backend/.env
   # Edit .env with production values
   docker-compose up -d
   ```

4. **Setup Domain** (Optional):
   - Point domain to EC2 IP
   - Update NGINX config with domain name
   - Add SSL with Let's Encrypt

---

## 📋 CHECKLIST OF MANUAL TASKS

### Critical (Do First):
- [ ] Create GitHub OAuth App
- [ ] Add GitHub credentials to .env files
- [ ] Implement GitHub OAuth backend endpoints
- [ ] Add NGINX to docker-compose
- [ ] Update Prometheus configuration in docker-compose
- [ ] Integrate deploy engine into main.py

### Important (Do Next):
- [ ] Setup Grafana dashboard
- [ ] Install and test agent locally
- [ ] Add GitHub integration to frontend
- [ ] Test one-click deploy locally

### Production (Do Later):
- [ ] Setup AWS EC2 instance
- [ ] Configure domain and SSL
- [ ] Setup GitHub Actions secrets
- [ ] Deploy to production

---

## 🎯 IMMEDIATE NEXT STEPS

**Start here:**

1. **Create GitHub OAuth App** (5 minutes)
2. **Update .env files** (2 minutes)
3. **Tell me you're ready** - I'll help you add the OAuth code
4. **Test locally** - We'll verify everything works

---

## 💡 TIPS

- **Test locally first** before deploying to AWS
- **Use ngrok** for testing webhooks locally
- **Keep API keys secure** - never commit to git
- **Backup database** before major changes

---

## 🆘 IF YOU GET STUCK

**Common Issues:**

1. **Docker build fails**: Check Dockerfile syntax
2. **Port already in use**: Change ports in docker-compose.yml
3. **Database connection fails**: Check DATABASE_URL
4. **GitHub OAuth fails**: Verify callback URL matches exactly

**Need Help?**
- Check logs: `docker-compose logs -f service-name`
- Restart services: `docker-compose restart`
- Rebuild: `docker-compose up -d --build`

---

## 🎉 WHEN YOU'RE DONE

You'll have:
- ✅ One-click GitHub deploy working
- ✅ Real-time monitoring with agents
- ✅ Beautiful Grafana dashboards
- ✅ Automated CI/CD pipeline
- ✅ Production-ready infrastructure

**Let's do this! Tell me when you're ready to start!** 🚀
