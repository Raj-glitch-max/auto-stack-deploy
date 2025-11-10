# Start Port Forwarding for AutoStack Apps
Write-Host "🚀 Starting port-forwarding..." -ForegroundColor Cyan
Write-Host ""

# Start backend port-forward in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🔹 Backend Port Forward' -ForegroundColor Cyan; Write-Host 'Backend API: http://localhost:8000' -ForegroundColor Green; Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Green; Write-Host ''; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; kubectl port-forward svc/autostack-backend -n default 8000:8000"

Start-Sleep -Seconds 2

# Start frontend port-forward in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🔹 Frontend Port Forward' -ForegroundColor Cyan; Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green; Write-Host ''; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; kubectl port-forward svc/autostack-frontend -n default 3000:3000"

Start-Sleep -Seconds 3

Write-Host "✅ Port-forwarding started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your apps:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

# Open browsers
Write-Host "🌐 Opening in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:8000/docs"
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ Done! Check your browser!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To stop: Close the port-forward PowerShell windows" -ForegroundColor Yellow
