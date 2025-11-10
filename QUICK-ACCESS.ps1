# Quick Access to AutoStack Apps
# Starts port-forwarding and opens browsers

Write-Host "🚀 AutoStack Quick Access" -ForegroundColor Cyan
Write-Host ""

# Kill any existing port-forwards
Write-Host "Cleaning up old port-forwards..." -ForegroundColor Yellow
Get-Job | Where-Object {$_.Command -like "*port-forward*"} | Stop-Job
Get-Job | Where-Object {$_.Command -like "*port-forward*"} | Remove-Job
Start-Sleep -Seconds 2

# Start backend port-forward
Write-Host "Starting backend port-forward (8000)..." -ForegroundColor Yellow
Start-Job -Name "backend-pf" -ScriptBlock { 
    kubectl port-forward svc/autostack-backend -n default 8000:8000 
} | Out-Null

Start-Sleep -Seconds 3

# Start frontend port-forward  
Write-Host "Starting frontend port-forward (3000)..." -ForegroundColor Yellow
Start-Job -Name "frontend-pf" -ScriptBlock { 
    kubectl port-forward svc/autostack-frontend -n default 3000:3000 
} | Out-Null

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Port-forwarding started!" -ForegroundColor Green
Write-Host ""

# Test connections
Write-Host "Testing connections..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend: WORKING" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Not responding" -ForegroundColor Red
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend: WORKING" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: Not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 YOUR APPS ARE READY!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

# Open browsers
Write-Host "Opening browsers..." -ForegroundColor Yellow
Start-Process "http://localhost:8000/docs"
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ Browsers opened!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To stop port-forwarding:" -ForegroundColor Yellow
Write-Host "   Get-Job | Stop-Job" -ForegroundColor Gray
Write-Host "   Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 To check status:" -ForegroundColor Yellow
Write-Host "   Get-Job" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 To restart:" -ForegroundColor Yellow
Write-Host "   .\QUICK-ACCESS.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 All set! Enjoy your apps!" -ForegroundColor Green
