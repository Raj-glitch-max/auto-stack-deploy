# Simple OAuth Test Script
# Run this AFTER starting Docker Desktop

Write-Host "🚀 Testing Google OAuth Configuration" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first, then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Services started. Waiting 35 seconds for initialization..." -ForegroundColor Green
Start-Sleep -Seconds 35
Write-Host ""

# Test backend
Write-Host "Testing backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not ready. Check: docker-compose logs backend" -ForegroundColor Red
    exit 1
}

# Test OAuth
Write-Host ""
Write-Host "Testing Google OAuth endpoint..." -ForegroundColor Yellow
try {
    $oauth = Invoke-RestMethod -Uri "http://localhost:8000/auth/google" -TimeoutSec 5
    Write-Host "✅ SUCCESS! OAuth endpoint is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "OAuth URL:" -ForegroundColor Cyan
    Write-Host $oauth.url -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Configuration is correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Next: Open http://localhost:3000/login and click 'Continue with Google'" -ForegroundColor Cyan
} catch {
    Write-Host "❌ OAuth test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker-compose logs backend --tail=30 | Select-String "Google"
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


