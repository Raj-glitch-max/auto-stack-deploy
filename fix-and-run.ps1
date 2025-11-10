# AutoStack - Complete Fix and Run Script
# Run this with: powershell -ExecutionPolicy Bypass -File fix-and-run.ps1

Write-Host "🚀 AutoStack - Complete Fix & Deploy Script" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Clean up Docker
Write-Host "🧹 Step 1: Cleaning up Docker..." -ForegroundColor Yellow
docker compose down -v 2>$null
docker system prune -af --volumes
Write-Host "✅ Cleanup complete`n" -ForegroundColor Green

# Step 2: Rebuild and start
Write-Host "🔨 Step 2: Building and starting containers..." -ForegroundColor Yellow
docker compose up --build -d

# Step 3: Wait for services
Write-Host "⏳ Step 3: Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Step 4: Check health
Write-Host "`n🏥 Step 4: Checking service health..." -ForegroundColor Yellow

Write-Host "Checking backend..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "✅ Backend: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Not responding" -ForegroundColor Red
}

Write-Host "Checking frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction Stop
    Write-Host "✅ Frontend: Running (Status $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
}

# Step 5: Test OAuth endpoint
Write-Host "`n🔐 Step 5: Testing Google OAuth endpoint..." -ForegroundColor Yellow
try {
    $oauth = Invoke-RestMethod -Uri "http://localhost:8000/auth/google" -ErrorAction Stop
    Write-Host "✅ OAuth: Google URL generated" -ForegroundColor Green
} catch {
    Write-Host "❌ OAuth: Failed - $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: View logs
Write-Host "`n📋 Step 6: Recent backend logs:" -ForegroundColor Yellow
docker compose logs backend --tail 20

Write-Host "`n" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Access your app:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test OAuth flow:" -ForegroundColor Yellow
Write-Host "   1. Open: http://localhost:3000/login" -ForegroundColor White
Write-Host "   2. Click 'Continue with Google'" -ForegroundColor White
Write-Host "   3. Complete authentication" -ForegroundColor White
Write-Host ""

# Open browser automatically
Write-Host "🌐 Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000/login"

Write-Host "`n✨ All done! Happy coding! ✨`n" -ForegroundColor Green
