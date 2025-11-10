# AutoStack OAuth Testing Script
# This script starts Docker services and tests the Google OAuth flow

Write-Host "🚀 AutoStack OAuth Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for service health
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxAttempts = 30
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be healthy..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is healthy!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Write-Host "   Attempt $i/$MaxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    Write-Host "❌ $ServiceName failed to become healthy" -ForegroundColor Red
    return $false
}

# Step 1: Check Docker
Write-Host "📋 Step 1: Checking Docker..." -ForegroundColor Cyan
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Step 2: Check environment variables
Write-Host "📋 Step 2: Checking environment variables..." -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Expected location: $envFile" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$envContent = Get-Content $envFile -Raw
if ($envContent -match "GOOGLE_CLIENT_ID=(.+)" -and $envContent -match "GOOGLE_CLIENT_SECRET=(.+)") {
    Write-Host "✅ Google OAuth credentials found in .env" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Google OAuth credentials not found in .env" -ForegroundColor Yellow
    Write-Host "   Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Start Docker services
Write-Host "📋 Step 3: Starting Docker services..." -ForegroundColor Cyan
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Docker services started" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for services to be healthy
Write-Host "📋 Step 4: Waiting for services to be healthy..." -ForegroundColor Cyan
Write-Host ""

# Wait for backend
if (-not (Wait-ForService -ServiceName "Backend API" -Url "http://localhost:8000/health")) {
    Write-Host ""
    Write-Host "❌ Backend failed to start. Check logs with: docker-compose logs backend" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for frontend
if (-not (Wait-ForService -ServiceName "Frontend" -Url "http://localhost:3000")) {
    Write-Host ""
    Write-Host "❌ Frontend failed to start. Check logs with: docker-compose logs frontend" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 5: Test OAuth endpoint
Write-Host "📋 Step 5: Testing Google OAuth endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/auth/google" -Method Get
    if ($response.url -and $response.url.StartsWith("https://accounts.google.com")) {
        Write-Host "✅ Google OAuth endpoint is working!" -ForegroundColor Green
        Write-Host "   OAuth URL: $($response.url.Substring(0, 80))..." -ForegroundColor Gray
    }
    else {
        Write-Host "⚠️  OAuth endpoint returned unexpected response" -ForegroundColor Yellow
        Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Failed to test OAuth endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Display service status
Write-Host "📋 Step 6: Service Status" -ForegroundColor Cyan
Write-Host ""
docker-compose ps
Write-Host ""

# Step 7: Display access URLs
Write-Host "🎉 All services are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:    http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana:    http://localhost:3001" -ForegroundColor White
Write-Host ""

# Step 8: Google Cloud Console configuration
Write-Host "⚙️  Google Cloud Console Configuration Required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "   2. Select your OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "   3. Add these Authorized JavaScript origins:" -ForegroundColor White
Write-Host "      • http://localhost:3000" -ForegroundColor Cyan
Write-Host "      • http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   4. Add this Authorized redirect URI:" -ForegroundColor White
Write-Host "      • http://localhost:8000/auth/google/callback" -ForegroundColor Cyan
Write-Host ""
Write-Host "   5. Click 'Save'" -ForegroundColor White
Write-Host ""

# Step 9: Testing instructions
Write-Host "🧪 Testing Instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Open http://localhost:3000/login in your browser" -ForegroundColor White
Write-Host "   2. Click 'Continue with Google' button" -ForegroundColor White
Write-Host "   3. Complete Google OAuth consent" -ForegroundColor White
Write-Host "   4. You should be redirected to the dashboard" -ForegroundColor White
Write-Host ""
Write-Host "   Expected console logs:" -ForegroundColor Gray
Write-Host "   Backend:  '🔐 Google OAuth callback initiated...'" -ForegroundColor Gray
Write-Host "   Frontend: '✅ Google OAuth successful! User: ...'" -ForegroundColor Gray
Write-Host ""

# Step 10: Troubleshooting
Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   View backend logs:  docker-compose logs -f backend" -ForegroundColor White
Write-Host "   View frontend logs: docker-compose logs -f frontend" -ForegroundColor White
Write-Host "   Restart services:   docker-compose restart" -ForegroundColor White
Write-Host "   Stop services:      docker-compose down" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup complete! Ready to test OAuth flow." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to open the login page in your browser..."
Read-Host

# Open browser
Start-Process "http://localhost:3000/login"

Write-Host ""
Write-Host "🎉 Browser opened! Test the Google OAuth login." -ForegroundColor Green
Write-Host ""
