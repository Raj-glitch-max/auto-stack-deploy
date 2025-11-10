# Diagnose ALB controller issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALB Controller Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

Write-Host "[1] Checking ALB controller deployment..." -ForegroundColor Yellow
kubectl get deployment aws-load-balancer-controller -n kube-system
Write-Host ""

Write-Host "[2] Checking ALB controller pods..." -ForegroundColor Yellow
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
Write-Host ""

Write-Host "[3] Checking pod details..." -ForegroundColor Yellow
$pods = kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller -o name 2>$null
if ($pods) {
    foreach ($pod in $pods) {
        Write-Host "Pod: $pod" -ForegroundColor Gray
        kubectl describe $pod -n kube-system | Select-String -Pattern "Events:" -Context 0,20
        Write-Host ""
    }
} else {
    Write-Host "[WARN] No ALB controller pods found" -ForegroundColor Yellow
}

Write-Host "[4] Checking pod logs..." -ForegroundColor Yellow
if ($pods) {
    foreach ($pod in $pods) {
        Write-Host "Logs for $pod" -ForegroundColor Gray
        kubectl logs $pod -n kube-system --tail=50 2>$null
        Write-Host ""
    }
}

Write-Host "[5] Checking service account..." -ForegroundColor Yellow
kubectl get sa aws-load-balancer-controller -n kube-system
Write-Host ""

Write-Host "[6] Checking IAM role annotation..." -ForegroundColor Yellow
kubectl get sa aws-load-balancer-controller -n kube-system -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
Write-Host ""
Write-Host ""

Write-Host "[7] Checking nodes..." -ForegroundColor Yellow
kubectl get nodes
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostics Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
