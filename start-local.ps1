# AutoStack - Start Services Locally (Simpler Version)
# This script opens separate terminal windows for each service

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AutoStack Local Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = & psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL: $pgVersion" -ForegroundColor Green
    } else {
        throw "PostgreSQL not found"
    }
} catch {
    Write-Host "✗ PostgreSQL not found or not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Cyan
Write-Host ""

# Create backend start script
$backendScript = @'
$host.UI.RawUI.WindowTitle = "AutoStack Backend"
Write-Host "Starting AutoStack Backend..." -ForegroundColor Cyan
Write-Host ""

Set-Location autostack-backend

# Activate virtual environment
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv .venv
    & .\.venv\Scripts\Activate.ps1
    pip install -r backend/requirements.txt
}

# Load environment variables from .env.local or .env
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
} else {
    Get-Content "../.env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
            $value = $matches[2]
            # Replace db:5432 with localhost:5432 for local setup
            $value = $value -replace 'db:5432', 'localhost:5432'
            [System.Environment]::SetEnvironmentVariable($matches[1], $value)
        }
    }
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
alembic upgrade head

Write-Host ""
Write-Host "Starting backend server on http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
'@

$backendScript | Out-File -FilePath "start-backend.ps1" -Encoding UTF8

# Create frontend start script
$frontendScript = @'
$host.UI.RawUI.WindowTitle = "AutoStack Frontend"
Write-Host "Starting AutoStack Frontend..." -ForegroundColor Cyan
Write-Host ""

Set-Location autostack-frontend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Ensure .env.local exists
if (-not (Test-Path ".env.local")) {
    "NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -FilePath ".env.local" -Encoding UTF8
}

Write-Host ""
Write-Host "Starting frontend server on http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm run dev
'@

$frontendScript | Out-File -FilePath "start-frontend.ps1" -Encoding UTF8

# Start backend in new window
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "start-backend.ps1"

Start-Sleep -Seconds 2

# Start frontend in new window
Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "start-frontend.ps1"

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Services Starting!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two terminal windows have been opened:" -ForegroundColor Yellow
Write-Host "  1. Backend (port 8000)" -ForegroundColor White
Write-Host "  2. Frontend (port 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Close those windows to stop the services." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
