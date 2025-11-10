# Quick Public Access via Port Forwarding
# Gets your apps online in 2 minutes!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Quick Public Access Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Step 1: Start Port Forwarding" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open 2 NEW PowerShell windows and run:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 (Frontend):" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/autostack-frontend -n default 3000:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 (Backend):" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/autostack-backend -n default 8000:8000" -ForegroundColor Gray
Write-Host ""

$portForward = Read-Host "Port forwarding started? (y/n)"
if ($portForward -ne "y") {
    Write-Host "Please start port forwarding first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🌐 Your Apps Are Now Accessible!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Local URLs:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Test them:" -ForegroundColor Yellow
Start-Process "http://localhost:8000/docs"
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📢 Want PUBLIC URLs?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$public = Read-Host "Make apps publicly accessible on internet? (y/n)"
if ($public -eq "y") {
    Write-Host ""
    Write-Host "Install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Extract to C:\ngrok\" -ForegroundColor White
    Write-Host "  3. Sign up (free): https://dashboard.ngrok.com/signup" -ForegroundColor White
    Write-Host ""
    
    Start-Process "https://ngrok.com/download"
    
    $ngrokInstalled = Read-Host "ngrok installed? (y/n)"
    if ($ngrokInstalled -eq "y") {
        Write-Host ""
        Write-Host "Configure ngrok:" -ForegroundColor Yellow
        Write-Host "  1. Get token: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        
        Start-Process "https://dashboard.ngrok.com/get-started/your-authtoken"
        
        $token = Read-Host "Enter your ngrok auth token"
        if ($token) {
            C:\ngrok\ngrok.exe config add-authtoken $token
            Write-Host "[OK] ngrok configured!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "🌐 Starting Public Tunnels!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Open 2 MORE PowerShell windows and run:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Terminal 3 (Frontend ngrok):" -ForegroundColor Cyan
        Write-Host "  C:\ngrok\ngrok.exe http 3000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Terminal 4 (Backend ngrok):" -ForegroundColor Cyan
        Write-Host "  C:\ngrok\ngrok.exe http 8000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Copy the 'Forwarding' URLs from each terminal!" -ForegroundColor Green
        Write-Host ""
        
        $frontendUrl = Read-Host "Enter frontend ngrok URL (https://xxx.ngrok.io)"
        $backendUrl = Read-Host "Enter backend ngrok URL (https://yyy.ngrok.io)"
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "🎉 YOUR APPS ARE LIVE ON THE INTERNET!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        @"
# AutoStack Public URLs (via ngrok)
Generated: $(Get-Date)

Frontend: $frontendUrl
Backend:  $backendUrl
API Docs: $backendUrl/docs

# Test:
curl $backendUrl/health

NOTE: These URLs are temporary and will change when you restart ngrok.
For permanent URLs, we need to fix the AWS Load Balancer IAM permissions.
"@ | Out-File -FilePath "PUBLIC-URLS-NGROK.txt" -Encoding UTF8
        
        Write-Host "✅ Public URLs:" -ForegroundColor Green
        Write-Host "   Frontend: $frontendUrl" -ForegroundColor White
        Write-Host "   Backend:  $backendUrl" -ForegroundColor White
        Write-Host "   API Docs: $backendUrl/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 URLs saved to PUBLIC-URLS-NGROK.txt" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔥 Share these URLs with anyone!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Apps Are Running!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keep the port-forward terminals running!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in those terminals to stop." -ForegroundColor Gray
