# Complete rebuild script for AutoStack
Write-Host "🚀 AutoStack - Complete Rebuild & Fix" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Step 1: Stop and remove everything
Write-Host "🛑 Stopping all containers..." -ForegroundColor Yellow
docker compose down -v 2>$null

# Step 2: Clean Docker cache
Write-Host "🧹 Cleaning Docker cache..." -ForegroundColor Yellow
docker system prune -af --volumes

# Step 3: Rebuild and start
Write-Host "`n🔨 Building and starting containers..." -ForegroundColor Yellow
docker compose up --build -d

# Step 4: Wait for services
Write-Host "`n⏳ Waiting for services (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 5: Check status
Write-Host "`n✅ Checking service status..." -ForegroundColor Green
docker compose ps

Write-Host "`n🎉 Done! Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`n📋 To view logs:" -ForegroundColor Cyan
Write-Host "   Backend:  docker compose logs -f backend" -ForegroundColor White
Write-Host "   Frontend: docker compose logs -f frontend" -ForegroundColor White
