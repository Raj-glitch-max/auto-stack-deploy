# Complete Fix - Deploy ALB Controller and Fix Failed Releases

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoStack - Complete Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure kubectl
Write-Host "[STEP 1/6] Configuring kubectl..." -ForegroundColor Yellow
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] kubectl configured" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to configure kubectl" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Clean up failed ArgoCD release
Write-Host "[STEP 2/6] Cleaning up failed ArgoCD release..." -ForegroundColor Yellow
helm uninstall argocd -n argocd --wait 2>&1 | Out-Null
kubectl delete namespace argocd --ignore-not-found=true 2>&1 | Out-Null
Write-Host "[OK] ArgoCD cleaned up" -ForegroundColor Green
Write-Host ""

# Step 3: Clean up any Prometheus release
Write-Host "[STEP 3/6] Cleaning up Prometheus release..." -ForegroundColor Yellow
helm uninstall prometheus -n monitoring --wait 2>&1 | Out-Null
kubectl delete namespace monitoring --ignore-not-found=true 2>&1 | Out-Null
Write-Host "[OK] Prometheus cleaned up" -ForegroundColor Green
Write-Host ""

# Step 4: Clean up Helm secrets
Write-Host "[STEP 4/6] Cleaning up Helm secrets..." -ForegroundColor Yellow
kubectl delete secrets -n kube-system -l owner=helm,status=pending-install --ignore-not-found=true 2>&1 | Out-Null
kubectl delete secrets -n kube-system -l owner=helm,status=pending-upgrade --ignore-not-found=true 2>&1 | Out-Null
Write-Host "[OK] Secrets cleaned up" -ForegroundColor Green
Write-Host ""

# Step 5: Show current state
Write-Host "[STEP 5/6] Current cluster state:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Helm Releases:" -ForegroundColor White
helm list -A
Write-Host ""
Write-Host "Namespaces:" -ForegroundColor White
kubectl get namespaces
Write-Host ""

# Step 6: Deploy with Terraform
Write-Host "[STEP 6/6] Deploying infrastructure with Terraform..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Deploy AWS Load Balancer Controller (2-3 min)" -ForegroundColor Gray
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
    
    Write-Host "ALB Controller Pods:" -ForegroundColor White
    kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
    Write-Host ""
    
    Write-Host "ArgoCD Pods:" -ForegroundColor White
    kubectl get pods -n argocd
    Write-Host ""
    
    Write-Host "ArgoCD Service:" -ForegroundColor White
    kubectl get svc -n argocd argocd-server
    Write-Host ""
    
    Write-Host "Prometheus Pods:" -ForegroundColor White
    kubectl get pods -n monitoring | Select-Object -First 10
    Write-Host ""
    
    Write-Host "[NEXT STEPS]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Get ArgoCD URL:" -ForegroundColor White
    Write-Host "   kubectl get svc -n argocd argocd-server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Get ArgoCD password:" -ForegroundColor White
    Write-Host "   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=`"{.data.password}`" | base64 -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Get Grafana URL:" -ForegroundColor White
    Write-Host "   kubectl get svc -n monitoring prometheus-grafana" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "[TIME] Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[TROUBLESHOOT]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check ALB controller:" -ForegroundColor White
    Write-Host "   kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller" -ForegroundColor Gray
    Write-Host "   kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check Helm releases:" -ForegroundColor White
    Write-Host "   helm list -A" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check events:" -ForegroundColor White
    Write-Host "   kubectl get events -n kube-system --sort-by='.lastTimestamp'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
