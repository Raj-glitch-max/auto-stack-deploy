# Wait for ALB controller webhook to be ready
Write-Host "[INFO] Waiting for ALB controller webhook to be ready..." -ForegroundColor Yellow

# Wait for deployment to be available
Write-Host "[INFO] Waiting for deployment to be available..." -ForegroundColor Gray
kubectl wait --for=condition=available --timeout=300s deployment/aws-load-balancer-controller -n kube-system

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Deployment did not become available" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Deployment is available" -ForegroundColor Green

# Wait for webhook service to have endpoints
Write-Host "[INFO] Waiting for webhook service endpoints..." -ForegroundColor Gray

$maxAttempts = 60
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    
    $endpoints = kubectl get endpoints aws-load-balancer-webhook-service -n kube-system -o jsonpath='{.subsets[*].addresses[*].ip}' 2>$null
    
    if ($endpoints -and $endpoints.Trim() -ne "") {
        Write-Host "[OK] Webhook service has endpoints: $endpoints" -ForegroundColor Green
        Write-Host "[INFO] Waiting additional 30 seconds for webhook to stabilize..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        Write-Host "[SUCCESS] Webhook is ready!" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "[WAIT] Waiting for webhook endpoints... ($attempt/$maxAttempts)" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

Write-Host "[ERROR] Webhook endpoints not ready after 5 minutes" -ForegroundColor Red
exit 1
