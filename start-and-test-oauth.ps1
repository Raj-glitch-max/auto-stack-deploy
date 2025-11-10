# Quick Start and Test Google OAuth
# Run this script after starting Docker Desktop

Write-Host "🚀 AutoStack Google OAuth Test Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker ps 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Check Docker
Write-Host "📋 Checking Docker..." -ForegroundColor Yellow
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Start Docker Desktop from the Start menu" -ForegroundColor White
    Write-Host "  2. Wait for Docker Desktop to fully start (whale icon in system tray)" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "📋 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services. Check Docker Desktop is running." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Wait for services
Write-Host "⏳ Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "   $i seconds remaining..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

Write-Host ""

# Test health
Write-Host "📋 Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "✅ Backend is healthy: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not ready yet. Wait a bit longer and try again." -ForegroundColor Red
    Write-Host "   Run: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test OAuth endpoint
Write-Host "📋 Testing Google OAuth endpoint..." -ForegroundColor Yellow
try {
    $oauth = Invoke-RestMethod -Uri "http://localhost:8000/auth/google" -TimeoutSec 5
    Write-Host "✅ Google OAuth endpoint is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "OAuth URL:" -ForegroundColor Cyan
    Write-Host $oauth.url -ForegroundColor White
    Write-Host ""
    
    # Verify configuration
    $hasClientId = $oauth.url -match "570685065231-45pa6c8o3j3l1ifrh7j3bb1711jdf49v"
    $hasCallback = $oauth.url -match "localhost:8000/auth/google/callback"
    
    if ($hasClientId -and $hasCallback) {
        Write-Host "✅ OAuth URL configuration is correct!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OAuth URL might have issues:" -ForegroundColor Yellow
        if (-not $hasClientId) { Write-Host "   - Client ID not found in URL" -ForegroundColor Yellow }
        if (-not $hasCallback) { Write-Host "   - Callback URL not found in URL" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "❌ OAuth endpoint test failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 500) {
            Write-Host ""
            Write-Host "   This might mean:" -ForegroundColor Yellow
            Write-Host "   - GOOGLE_CLIENT_ID is not set in environment" -ForegroundColor White
            Write-Host "   - Check: docker-compose logs backend | Select-String 'Google OAuth'" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Checking backend logs..." -ForegroundColor Yellow
    docker-compose logs backend --tail=20 | Select-String "Google OAuth" -Context 2
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open: http://localhost:3000/login" -ForegroundColor White
Write-Host "  2. Click 'Continue with Google'" -ForegroundColor White
Write-Host "  3. Complete OAuth flow" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Make sure Google Cloud Console has:" -ForegroundColor Yellow
Write-Host "   Redirect URI: http://localhost:8000/auth/google/callback" -ForegroundColor White
Write-Host ""
Write-Host "📝 View logs: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host ""


