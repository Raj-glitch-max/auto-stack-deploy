# 🚀 AutoStack - One-Click Deployment Platform

**Deploy your applications with a single click. Built with Next.js, FastAPI, and Docker.**

---

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with automatic token refresh
- 🐙 **GitHub Integration** - Connect your repositories and deploy instantly
- 🐳 **Docker Deployments** - Automatic containerization and deployment
- 📊 **Real-time Monitoring** - Prometheus + Grafana integration
- 🎨 **Modern UI** - Beautiful, responsive interface with glassmorphism design
- ⚡ **Fast & Reliable** - Built on Next.js 15 and FastAPI

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Raj-glitch-max/auto-stack-deploy.git
cd auto-stack-deploy

# Start all services
docker-compose up -d

# Wait for services to start (30-60 seconds)
# Then access the application
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### First Login

```
Email: pdinkar821@gmail.com
Password: Test@123456
```

Or create a new account at http://localhost:3000/signup

---

## 📁 Project Structure

```
autostack/
├── autostack-frontend/     # Next.js 15 frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utilities and API client
│   └── Dockerfile
│
├── autostack-backend/     # FastAPI backend
│   └── backend/
│       ├── alembic/      # Database migrations
│       ├── auth.py       # Authentication logic
│       ├── crud.py       # Database operations
│       ├── deploy_engine.py  # Deployment logic
│       ├── main.py       # FastAPI app
│       ├── models.py     # SQLAlchemy models
│       └── Dockerfile
│
├── monitoring/           # Prometheus & Grafana configs
├── docker-compose.yml    # Docker Compose configuration
└── README.md            # This file
```

---

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **Animations**: Framer Motion
- **HTTP Client**: Axios with interceptors

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy (async)
- **Auth**: JWT with refresh tokens
- **Migrations**: Alembic
- **Deployment**: Docker SDK

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Reverse Proxy**: NGINX (production)
- **Database**: PostgreSQL with persistent volumes

---

## 🛠️ Development

### Running Locally

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

### Environment Variables

#### Backend (`.env`)
```bash
DATABASE_URL=postgresql+asyncpg://autostack:autostack@db:5432/autostack
SECRET_KEY=your-secret-key-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=false
```

### Database Migrations

```bash
# Create a new migration
docker exec -it autostack-backend alembic revision --autogenerate -m "description"

# Apply migrations
docker exec -it autostack-backend alembic upgrade head

# Rollback
docker exec -it autostack-backend alembic downgrade -1
```

---

## 🐳 Docker Configuration

### Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js application |
| backend | 8000 | FastAPI server |
| db | 5432 | PostgreSQL database |
| prometheus | 9090 | Metrics collection |
| grafana | 3001 | Metrics visualization |

### Volumes

- `postgres_data` - Persistent database storage
- `/var/run/docker.sock` - Docker socket for deployments

### Networks

All services run on the `projects_default` network, allowing inter-container communication using service names (e.g., `backend:8000`).

---

## 🔐 Authentication Flow

1. **Login/Signup** - User provides credentials
2. **Token Generation** - Backend issues access token (JWT) + refresh token
3. **Token Storage** - Tokens stored in localStorage
4. **API Requests** - Access token sent in Authorization header
5. **Token Refresh** - On 401 error, automatically refresh using refresh token
6. **Seamless UX** - User never sees authentication errors

### GitHub OAuth

1. User clicks "Connect GitHub Account"
2. Redirected to GitHub authorization
3. GitHub redirects back with code
4. Backend exchanges code for access token
5. User's GitHub repos become available for deployment

---

## 🚢 Deployment Workflow

1. **Connect GitHub** - Link your GitHub account
2. **Select Repository** - Choose a repo to deploy
3. **Configure** - Set environment variables (optional)
4. **Deploy** - Click deploy button
5. **Monitor** - Watch real-time logs and status
6. **Access** - Get your deployment URL

### How It Works

- Backend clones your repository
- Detects framework (Next.js, React, etc.)
- Builds Docker image
- Starts container with assigned port
- Monitors deployment status
- Provides access URL

---

## 📊 Monitoring

### Prometheus Metrics

- CPU usage per deployment
- Memory usage per deployment
- Request rates
- Error rates
- Deployment status

### Grafana Dashboards

Access Grafana at http://localhost:3001 (admin/admin)

Pre-configured dashboards:
- System Overview
- Deployment Metrics
- API Performance

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
docker exec -it autostack-backend pytest

# Run with coverage
docker exec -it autostack-backend pytest --cov=backend
```

### Frontend Tests

```bash
# Run tests
docker exec -it autostack-frontend npm test

# Run with watch mode
docker exec -it autostack-frontend npm test -- --watch
```

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:8000/health
   ```

2. **User Signup**
   ```bash
   curl -X POST http://localhost:8000/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test@123456","name":"Test User"}'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:8000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test@123456"}'
   ```

---

## 🐛 Troubleshooting

### Frontend can't reach backend

**Problem**: Console shows connection errors or 401/500 errors

**Solution**: Ensure `NEXT_PUBLIC_API_URL` is set correctly:
- In Docker: `http://backend:8000`
- Locally: `http://localhost:8000`

```bash
# Rebuild with correct URL
docker-compose down
docker-compose up --build -d
```

### Database connection errors

**Problem**: Backend fails to start with database errors

**Solution**: Ensure database is healthy
```bash
docker-compose ps
docker logs autostack-db

# Restart database
docker-compose restart db
```

### Port already in use

**Problem**: `Error: Port 3000/8000 already in use`

**Solution**: Stop conflicting services
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process or stop docker containers
docker stop $(docker ps -q)
```

### Clean restart

```bash
# Stop everything and remove volumes
docker-compose down -v

# Remove all Docker resources
docker system prune -af

# Start fresh
docker-compose up --build -d
```

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /signup` - Create new user account
- `POST /login` - Login and get tokens
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (client-side)
- `GET /me` - Get current user info

### GitHub Integration

- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `GET /github/repos` - List user's repositories

### Deployment Endpoints

- `POST /deploy` - Create new deployment
- `GET /deployments` - List all deployments
- `GET /status/{deploy_id}` - Get deployment status
- `GET /logs/{deploy_id}` - Get deployment logs

### Health & Monitoring

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /metrics/overview` - System overview

Full API documentation available at: http://localhost:8000/docs

---

## 🔒 Security

- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with Argon2
- ✅ CORS configuration for allowed origins
- ✅ Rate limiting on API endpoints
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (React escaping)
- ✅ Environment variable management
- ✅ Secure token storage (httpOnly cookies option)

### Production Recommendations

1. **Change default credentials**
2. **Use strong SECRET_KEY**
3. **Enable HTTPS**
4. **Configure proper CORS origins**
5. **Set up database backups**
6. **Use secrets management (e.g., AWS Secrets Manager)**
7. **Enable rate limiting**
8. **Set up monitoring alerts**

---

## 🚀 Production Deployment

See [SETUP.md](./SETUP.md) for detailed production deployment instructions including:
- AWS/GCP/Azure deployment
- Domain configuration
- SSL certificates
- Environment setup
- Scaling strategies

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI team for the blazing-fast API framework
- Docker for containerization
- All open-source contributors

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Raj-glitch-max/auto-stack-deploy/issues)
- **Email**: pdinkar821@gmail.com

---

**Built with ❤️ by Raj**
