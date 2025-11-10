# Targeted Fix - Recreate ALB Controller and Fix Failed Releases

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Targeted Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
Write-Host "[STEP 1/5] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null
Write-Host "[OK] kubectl configured" -ForegroundColor Green
Write-Host ""

# Taint ALB controller resource to force recreation
Write-Host "[STEP 2/5] Marking ALB controller for recreation..." -ForegroundColor Yellow
terraform taint module.k8s_addons.helm_release.aws_load_balancer_controller
Write-Host "[OK] ALB controller marked for recreation" -ForegroundColor Green
Write-Host ""

# Taint null_resource to force webhook wait
Write-Host "[STEP 3/5] Marking webhook wait for recreation..." -ForegroundColor Yellow
terraform taint module.k8s_addons.null_resource.wait_for_alb_webhook
Write-Host "[OK] Webhook wait marked for recreation" -ForegroundColor Green
Write-Host ""

# Clean up failed releases
Write-Host "[STEP 4/5] Cleaning up failed releases..." -ForegroundColor Yellow

# Clean up ArgoCD
Write-Host "  - Removing failed ArgoCD release..." -ForegroundColor Gray
kubectl delete namespace argocd --ignore-not-found=true --timeout=60s 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm --ignore-not-found=true 2>&1 | Out-Null

# Clean up Prometheus
Write-Host "  - Removing Prometheus namespace..." -ForegroundColor Gray
kubectl delete namespace monitoring --ignore-not-found=true --timeout=60s 2>&1 | Out-Null

# Clean up any pending secrets
Write-Host "  - Cleaning up Helm secrets..." -ForegroundColor Gray
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Wait for namespaces to be deleted
Write-Host "  - Waiting for namespaces to be fully deleted..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

# Deploy with Terraform
Write-Host "[STEP 5/5] Deploying with Terraform..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will recreate:" -ForegroundColor White
Write-Host "  1. AWS Load Balancer Controller (2-3 min)" -ForegroundColor Gray
Write-Host "  2. Webhook wait resource (2-5 min)" -ForegroundColor Gray
Write-Host "  3. ArgoCD (3-5 min)" -ForegroundColor Gray
Write-Host "  4. Prometheus (7-10 min)" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected time: 14-23 minutes" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

terraform apply -auto-approve -target=module.k8s_addons.helm_release.aws_load_balancer_controller -target=module.k8s_addons.null_resource.wait_for_alb_webhook -target=module.k8s_addons.helm_release.argocd -target=module.k8s_addons.helm_release.kube_prometheus_stack

if ($LASTEXITCODE -eq 0) {
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[SUCCESS] Targeted deployment completed!" -ForegroundColor Green
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[VERIFY] Checking status..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "ALB Controller:" -ForegroundColor White
    kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
    Write-Host ""
    
    Write-Host "ArgoCD:" -ForegroundColor White
    kubectl get pods -n argocd
    Write-Host ""
    
    Write-Host "Prometheus:" -ForegroundColor White
    kubectl get pods -n monitoring | Select-Object -First 5
    Write-Host ""
    
    Write-Host "[SUCCESS] All resources deployed!" -ForegroundColor Green
    Write-Host ""
    
} else {
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[TROUBLESHOOT] Run diagnostics:" -ForegroundColor Yellow
    Write-Host "  .\diagnose-alb.ps1" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
