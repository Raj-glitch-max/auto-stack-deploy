# AutoStack Production Deployment Script (PowerShell)
# This script automates the deployment process

$ErrorActionPreference = "Stop"

Write-Host "🚀 AutoStack Production Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Print-Success "Docker is installed"
} catch {
    Print-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Print-Success "Docker Compose is installed"
} catch {
    Print-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Print-Error ".env file not found. Please create it first."
    exit 1
}
Print-Success ".env file found"

# Enable BuildKit for faster builds
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"
Print-Success "BuildKit enabled for optimized builds"

# Stop and remove existing containers
Write-Host ""
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Cyan
try {
    docker-compose down -v 2>$null
} catch {
    # Ignore errors if no containers exist
}
Print-Success "Cleanup complete"

# Build and start services
Write-Host ""
Write-Host "🔨 Building Docker images (this may take 2-3 minutes)..." -ForegroundColor Cyan
Write-Host "   - Frontend: ~60-90 seconds"
Write-Host "   - Backend: ~30-45 seconds"
Write-Host "   - Database: ~10 seconds"
Write-Host ""

$StartTime = Get-Date

try {
    docker-compose up --build -d
    $EndTime = Get-Date
    $Duration = ($EndTime - $StartTime).TotalSeconds
    Print-Success "Build completed in $([math]::Round($Duration, 0)) seconds"
} catch {
    Print-Error "Build failed. Check logs with: docker-compose logs"
    exit 1
}

# Wait for services to be healthy
Write-Host ""
Write-Host "⏳ Waiting for services to become healthy..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "🏥 Health Check Status:" -ForegroundColor Cyan
Write-Host "----------------------"

function Check-ServiceHealth {
    param($ServiceName)
    
    $status = docker-compose ps | Select-String $ServiceName
    
    if ($status -match "healthy") {
        Print-Success "$ServiceName is healthy"
        return $true
    } elseif ($status -match "Up") {
        Print-Warning "$ServiceName is running (health check pending)"
        return $true
    } else {
        Print-Error "$ServiceName is not running"
        return $false
    }
}

$Services = @("autostack-db", "autostack-backend", "autostack-frontend", "autostack-prometheus", "autostack-grafana")
$AllHealthy = $true

foreach ($Service in $Services) {
    if (-Not (Check-ServiceHealth $Service)) {
        $AllHealthy = $false
    }
}

# Display service URLs
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "---------------"
Write-Host "Frontend:   http://localhost:3000"
Write-Host "Backend:    http://localhost:8000/docs"
Write-Host "Grafana:    http://localhost:3001 (admin/admin)"
Write-Host "Prometheus: http://localhost:9090"

# Display container status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
Write-Host "-------------------"
docker-compose ps

# Show logs option
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "------------------"
Write-Host "View all logs:        docker-compose logs -f"
Write-Host "View specific logs:   docker-compose logs -f <service>"
Write-Host "Restart service:      docker-compose restart <service>"
Write-Host "Stop all:             docker-compose down"
Write-Host "Rebuild specific:     docker-compose up --build -d <service>"

if ($AllHealthy) {
    Write-Host ""
    Print-Success "🎉 Deployment successful! All services are running."
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Visit http://localhost:3000 to verify the application works"
    Write-Host "2. Test OAuth login functionality"
    Write-Host "3. Check monitoring dashboards in Grafana"
    Write-Host "4. Review logs for any warnings: docker-compose logs"
} else {
    Write-Host ""
    Print-Warning "⚠️  Some services may not be fully healthy yet."
    Write-Host "Wait a few more seconds and check: docker-compose ps"
    Write-Host "View logs for troubleshooting: docker-compose logs -f"
}

Write-Host ""
Write-Host "For detailed documentation, see: OPTIMIZED_BUILD_GUIDE.md" -ForegroundColor Cyan
