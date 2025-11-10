# Make AutoStack Apps Publicly Accessible
# This script exposes your apps to the internet via LoadBalancer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🌐 Making AutoStack Apps Public" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: AWS Network Load Balancer (NLB)" -ForegroundColor Yellow
Write-Host "  - Fastest to set up (2 minutes)" -ForegroundColor White
Write-Host "  - Costs: ~$16/month per LB" -ForegroundColor White
Write-Host "  - Gets you public IP immediately" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: AWS Application Load Balancer (ALB)" -ForegroundColor Yellow
Write-Host "  - More features (SSL, routing)" -ForegroundColor White
Write-Host "  - Costs: ~$16/month + data" -ForegroundColor White
Write-Host "  - Requires Ingress setup" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Port Forwarding (Free)" -ForegroundColor Yellow
Write-Host "  - Use ngrok or similar" -ForegroundColor White
Write-Host "  - Temporary URLs" -ForegroundColor White
Write-Host "  - Good for testing" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Which option? (1/2/3)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "🚀 Setting up Network Load Balancer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Update frontend service to LoadBalancer
    Write-Host "Updating frontend service to LoadBalancer type..." -ForegroundColor Yellow
    
    $frontendPatch = @"
spec:
  type: LoadBalancer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
"@
    
    kubectl patch svc autostack-frontend -n default --patch $frontendPatch
    
    Write-Host "[OK] Frontend service updated" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Updating backend service to LoadBalancer type..." -ForegroundColor Yellow
    
    $backendPatch = @"
spec:
  type: LoadBalancer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
"@
    
    kubectl patch svc autostack-backend -n default --patch $backendPatch
    
    Write-Host "[OK] Backend service updated" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "⏳ Waiting for Load Balancers to provision (this takes 2-3 minutes)..." -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 30
    
    Write-Host "Checking status..." -ForegroundColor Cyan
    kubectl get svc -n default
    Write-Host ""
    
    Write-Host "⏳ Still provisioning... (checking again in 60 seconds)" -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🎉 Load Balancers Provisioned!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    $frontendLB = kubectl get svc autostack-frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    $backendLB = kubectl get svc autostack-backend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    
    Write-Host "🌐 Your Apps Are LIVE:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Frontend: http://$frontendLB" -ForegroundColor Green
    Write-Host "Backend:  http://$backendLB" -ForegroundColor Green
    Write-Host ""
    Write-Host "API Docs: http://$backendLB/docs" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "💾 Saving URLs..." -ForegroundColor Yellow
    
    @"
# AutoStack Public URLs
Generated: $(Get-Date)

Frontend: http://$frontendLB
Backend:  http://$backendLB
API Docs: http://$backendLB/docs

# Test the apps:
curl http://$backendLB/health
"@ | Out-File -FilePath "PUBLIC-URLS.txt" -Encoding UTF8
    
    Write-Host "[OK] URLs saved to PUBLIC-URLS.txt" -ForegroundColor Green
    Write-Host ""
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "ALB setup requires Ingress configuration..." -ForegroundColor Yellow
    Write-Host "Use Option 1 (NLB) for quick setup, or see docs/03-POST-DEPLOYMENT-GUIDE.md" -ForegroundColor White
    
} elseif ($choice -eq "3") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "🔗 Port Forwarding Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Sign up (free): https://dashboard.ngrok.com/signup" -ForegroundColor White
    Write-Host "  3. Get auth token: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Expose Frontend:" -ForegroundColor Cyan
    Write-Host "  kubectl port-forward svc/autostack-frontend -n default 3000:3000" -ForegroundColor White
    Write-Host "  ngrok http 3000" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Expose Backend:" -ForegroundColor Cyan
    Write-Host "  kubectl port-forward svc/autostack-backend -n default 8000:8000" -ForegroundColor White
    Write-Host "  ngrok http 8000" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "✅ Next: Set up one-click deployment!" -ForegroundColor Green
Write-Host "   Run: .\setup-one-click-deploy.ps1" -ForegroundColor Cyan
