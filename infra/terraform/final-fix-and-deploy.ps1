# Final Fix and Deploy - Complete Solution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Final Fix and Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
Write-Host "[STEP 1/5] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] kubectl configured" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to configure kubectl" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Delete broken ALB controller
Write-Host "[STEP 2/5] Removing broken ALB controller..." -ForegroundColor Yellow
helm uninstall aws-load-balancer-controller -n kube-system --wait 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] ALB controller removed" -ForegroundColor Green
} else {
    Write-Host "[WARN] ALB controller may not exist (continuing)" -ForegroundColor Yellow
}

# Wait for cleanup
Write-Host "[INFO] Waiting for cleanup to complete..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

# Clean up any pending secrets
Write-Host "[STEP 3/5] Cleaning up Helm secrets..." -ForegroundColor Yellow
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n argocd -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n monitoring -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null

Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Show what was fixed
Write-Host "[STEP 4/5] Summary of fixes applied:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [FIX 1] Added VPC ID to ALB controller configuration" -ForegroundColor White
Write-Host "          - ALB controller was failing with 401 error" -ForegroundColor Gray
Write-Host "          - Couldn't get VPC ID from EC2 metadata" -ForegroundColor Gray
Write-Host "          - Now explicitly passing VPC ID and region" -ForegroundColor Gray
Write-Host ""
Write-Host "  [FIX 2] Added explicit webhook wait with null_resource" -ForegroundColor White
Write-Host "          - Waits for deployment to be available" -ForegroundColor Gray
Write-Host "          - Waits for webhook endpoints" -ForegroundColor Gray
Write-Host "          - 30-second stabilization period" -ForegroundColor Gray
Write-Host ""
Write-Host "  [FIX 3] Updated ArgoCD and Prometheus dependencies" -ForegroundColor White
Write-Host "          - Both depend on webhook wait resource" -ForegroundColor Gray
Write-Host "          - No race conditions possible" -ForegroundColor Gray
Write-Host ""
Write-Host "  [FIX 4] Disabled Prometheus Operator webhooks" -ForegroundColor White
Write-Host "          - Prevents conflicts with ALB controller" -ForegroundColor Gray
Write-Host ""

# Deploy
Write-Host "[STEP 5/5] Deploying infrastructure..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Create ALB controller with VPC ID (2-3 min)" -ForegroundColor Gray
Write-Host "  2. Wait for webhook to be ready (2-5 min)" -ForegroundColor Gray
Write-Host "  3. Deploy ArgoCD with LoadBalancer (3-5 min)" -ForegroundColor Gray
Write-Host "  4. Deploy Prometheus with LoadBalancer (7-10 min)" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected total time: 14-23 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C within 5 seconds to cancel..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

$startTime = Get-Date

terraform apply -auto-approve

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Deployment completed!" -ForegroundColor Green
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[VERIFY] Checking deployment status..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Helm Releases:" -ForegroundColor White
    helm list -A
    Write-Host ""
    
    Write-Host "Pod Status:" -ForegroundColor White
    kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
    kubectl get pods -n argocd
    kubectl get pods -n monitoring | Select-Object -First 10
    Write-Host ""
    
    Write-Host "[NEXT] Get service URLs:" -ForegroundColor Cyan
    Write-Host "  kubectl get svc -n argocd argocd-server" -ForegroundColor White
    Write-Host "  kubectl get svc -n monitoring prometheus-grafana" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[TROUBLESHOOT] Check the error messages above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor White
    Write-Host "  1. Run diagnostics: .\diagnose-alb.ps1" -ForegroundColor Gray
    Write-Host "  2. Check pod logs: kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
