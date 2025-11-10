# AutoStack - Run Without Docker Desktop
# This script runs all services locally on Windows without Docker

param(
    [switch]$SetupOnly,
    [switch]$SkipPostgres,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AutoStack Local Setup (No Docker)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed and running
function Test-PostgreSQL {
    Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
    
    try {
        $pgVersion = & psql --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "✗ PostgreSQL not found in PATH" -ForegroundColor Red
        return $false
    }
    return $false
}

# Check if database exists and create if needed
function Setup-Database {
    Write-Host ""
    Write-Host "Setting up database..." -ForegroundColor Yellow
    
    # Try to connect to postgres database first
    $env:PGPASSWORD = "postgres"
    
    # Check if autostack database exists
    $dbExists = & psql -U postgres -h localhost -lqt 2>&1 | Select-String -Pattern "autostack"
    
    if (-not $dbExists) {
        Write-Host "Creating database 'autostack'..." -ForegroundColor Yellow
        & psql -U postgres -h localhost -c "CREATE DATABASE autostack;" 2>&1 | Out-Null
        & psql -U postgres -h localhost -c "CREATE USER autostack WITH PASSWORD 'autostack';" 2>&1 | Out-Null
        & psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE autostack TO autostack;" 2>&1 | Out-Null
        Write-Host "✓ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "✓ Database 'autostack' already exists" -ForegroundColor Green
    }
}

# Setup Python virtual environment and install dependencies
function Setup-Backend {
    Write-Host ""
    Write-Host "Setting up backend..." -ForegroundColor Yellow
    
    Push-Location "autostack-backend"
    
    # Check if virtual environment exists
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv .venv
    }
    
    # Activate virtual environment
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
    
    # Install dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r backend/requirements.txt --quiet
    
    Write-Host "✓ Backend setup complete" -ForegroundColor Green
    
    Pop-Location
}

# Setup Node.js dependencies
function Setup-Frontend {
    Write-Host ""
    Write-Host "Setting up frontend..." -ForegroundColor Yellow
    
    Push-Location "autostack-frontend"
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
        npm install
    } else {
        Write-Host "✓ Node modules already installed" -ForegroundColor Green
    }
    
    Write-Host "✓ Frontend setup complete" -ForegroundColor Green
    
    Pop-Location
}

# Create local environment file
function Create-LocalEnv {
    Write-Host ""
    Write-Host "Creating local environment configuration..." -ForegroundColor Yellow
    
    $localEnv = @"
# AutoStack Local Environment (No Docker)
# This file is used when running without Docker Desktop

# Google OAuth
GOOGLE_CLIENT_ID=570685065231-45pa6c8o3j3l1ifrh7j3bb1711jdf49v.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23liwBu5UlgbbLnOej
GITHUB_CLIENT_SECRET=e233c56d8a7fef18c8b74e5fe6baf3eaac08d0d0
GITHUB_CALLBACK_URL=http://localhost:8000/auth/github/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database (Local PostgreSQL)
DATABASE_URL=postgresql+asyncpg://autostack:autostack@localhost:5432/autostack

# JWT Configuration
SECRET_KEY=autostack-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
"@
    
    $localEnv | Out-File -FilePath "autostack-backend\.env.local" -Encoding UTF8
    Write-Host "✓ Created autostack-backend\.env.local" -ForegroundColor Green
    
    $frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:8000
"@
    
    $frontendEnv | Out-File -FilePath "autostack-frontend\.env.local" -Encoding UTF8
    Write-Host "✓ Created autostack-frontend\.env.local" -ForegroundColor Green
}

# Main setup
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Cyan

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18 or higher." -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
$pgInstalled = Test-PostgreSQL

if (-not $pgInstalled) {
    Write-Host ""
    Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Install with default settings (port 5432)" -ForegroundColor Yellow
    Write-Host "3. Remember the password you set for 'postgres' user" -ForegroundColor Yellow
    Write-Host "4. Add PostgreSQL bin directory to PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Create local environment files
Create-LocalEnv

# Setup database
if (-not $SkipPostgres) {
    Setup-Database
}

# Setup backend
if (-not $SkipBackend) {
    Setup-Backend
}

# Setup frontend
if (-not $SkipFrontend) {
    Setup-Frontend
}

if ($SetupOnly) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To start the services, run:" -ForegroundColor Yellow
    Write-Host "  .\run-without-docker.ps1" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Starting Services..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Start backend
Write-Host ""
Write-Host "Starting backend on http://localhost:8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Push-Location "autostack-backend"
    & .\.venv\Scripts\Activate.ps1
    
    # Load environment variables
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    
    # Run migrations
    alembic upgrade head
    
    # Start server
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend on http://localhost:3000..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Push-Location "autostack-frontend"
    npm run dev
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Monitor jobs
try {
    while ($true) {
        # Check if jobs are still running
        if ($backendJob.State -ne "Running") {
            Write-Host "Backend stopped unexpectedly" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }
        if ($frontendJob.State -ne "Running") {
            Write-Host "Frontend stopped unexpectedly" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }
        
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor Green
}
