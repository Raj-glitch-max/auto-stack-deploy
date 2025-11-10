# AutoStack - Simple Start (Uses SQLite, No PostgreSQL Required)
# This is the easiest way to run AutoStack locally

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AutoStack Simple Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script uses SQLite instead of PostgreSQL" -ForegroundColor Yellow
Write-Host "Perfect for quick testing and development!" -ForegroundColor Yellow
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "[OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found" -ForegroundColor Red
    Write-Host "  Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setting up services..." -ForegroundColor Cyan
Write-Host ""

# Setup backend with SQLite
Write-Host "Setting up backend..." -ForegroundColor Yellow

Push-Location "autostack-backend"

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "  Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv .venv
}

# Activate virtual environment
& .\.venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "  Installing Python dependencies (this may take a minute)..." -ForegroundColor Gray
pip install -r backend/requirements.txt --quiet --disable-pip-version-check

# Create .env.local with SQLite
$backendEnv = @"
# AutoStack Local Environment (SQLite)
DATABASE_URL=sqlite+aiosqlite:///./autostack.db

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

# JWT Configuration
SECRET_KEY=autostack-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
"@

$backendEnv | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "[OK] Backend setup complete" -ForegroundColor Green

Pop-Location

# Setup frontend
Write-Host "Setting up frontend..." -ForegroundColor Yellow

Push-Location "autostack-frontend"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing Node.js dependencies (this may take a few minutes)..." -ForegroundColor Gray
    npm install --silent
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Gray
}

# Create .env.local
$frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:8000
"@

$frontendEnv | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "[OK] Frontend setup complete" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Starting Services..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Create backend start script
$backendScript = @'
$host.UI.RawUI.WindowTitle = "AutoStack Backend (SQLite)"
$host.UI.RawUI.BackgroundColor = "DarkBlue"
Clear-Host

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AutoStack Backend" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Set-Location autostack-backend

# Activate virtual environment
& .\.venv\Scripts\Activate.ps1

# Load environment variables
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
alembic upgrade head

Write-Host ""
Write-Host "Backend server starting..." -ForegroundColor Green
Write-Host "  URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Database: SQLite (autostack.db)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
'@

$backendScript | Out-File -FilePath "start-backend-simple.ps1" -Encoding UTF8

# Create frontend start script
$frontendScript = @'
$host.UI.RawUI.WindowTitle = "AutoStack Frontend"
$host.UI.RawUI.BackgroundColor = "DarkGreen"
Clear-Host

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AutoStack Frontend" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Set-Location autostack-frontend

Write-Host "Frontend server starting..." -ForegroundColor Green
Write-Host "  URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
'@

$frontendScript | Out-File -FilePath "start-frontend-simple.ps1" -Encoding UTF8

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "start-backend-simple.ps1"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "start-frontend-simple.ps1"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Services Started Successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two terminal windows have been opened:" -ForegroundColor Yellow
Write-Host "  - Backend (blue window) - port 8000" -ForegroundColor White
Write-Host "  - Frontend (green window) - port 3000" -ForegroundColor White
Write-Host ""
Write-Host "To stop the services:" -ForegroundColor Yellow
Write-Host "  - Close both terminal windows, or" -ForegroundColor White
Write-Host "  - Press Ctrl+C in each window" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait for both services to fully start (30-60 seconds)" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  3. Try logging in with Google OAuth" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
