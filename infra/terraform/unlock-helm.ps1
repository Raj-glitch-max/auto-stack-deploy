# Unlock Helm releases that are stuck in pending state

Write-Host "[INFO] Unlocking Helm releases..." -ForegroundColor Yellow
Write-Host ""

# Configure kubectl
Write-Host "[INFO] Configuring kubectl..." -ForegroundColor Gray
aws eks update-kubeconfig --region ap-south-1 --name autostack-prod-eks 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to configure kubectl" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] kubectl configured" -ForegroundColor Green
Write-Host ""

# Check for pending Helm releases
Write-Host "[INFO] Checking for stuck Helm releases..." -ForegroundColor Yellow

$helmReleases = @(
    @{Name="aws-load-balancer-controller"; Namespace="kube-system"},
    @{Name="metrics-server"; Namespace="kube-system"},
    @{Name="cluster-autoscaler"; Namespace="kube-system"},
    @{Name="argocd"; Namespace="argocd"},
    @{Name="prometheus"; Namespace="monitoring"}
)

foreach ($release in $helmReleases) {
    $name = $release.Name
    $ns = $release.Namespace
    
    Write-Host "  Checking $name in namespace $ns..." -ForegroundColor Gray
    
    # Check if release exists
    $status = helm status $name -n $ns 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Release exists, check if it's in pending state
        $statusOutput = $status | Out-String
        
        if ($statusOutput -match "pending") {
            Write-Host "  [WARN] Release $name is in pending state, rolling back..." -ForegroundColor Yellow
            helm rollback $name -n $ns 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] Rolled back $name" -ForegroundColor Green
            } else {
                Write-Host "  [WARN] Could not rollback $name, trying uninstall..." -ForegroundColor Yellow
                helm uninstall $name -n $ns 2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  [OK] Uninstalled $name" -ForegroundColor Green
                } else {
                    Write-Host "  [ERROR] Could not uninstall $name" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "  [OK] Release $name is in good state" -ForegroundColor Green
        }
    } else {
        Write-Host "  [INFO] Release $name does not exist (will be created)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[INFO] Checking for stuck Helm secrets..." -ForegroundColor Yellow

# Delete pending-install/pending-upgrade secrets
$namespaces = @("kube-system", "argocd", "monitoring")

foreach ($ns in $namespaces) {
    Write-Host "  Checking namespace $ns..." -ForegroundColor Gray
    
    # Get all helm secrets in pending state
    $secrets = kubectl get secrets -n $ns -l owner=helm,status=pending-install -o name 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $secrets) {
        foreach ($secret in $secrets) {
            Write-Host "  [WARN] Found pending secret: $secret" -ForegroundColor Yellow
            kubectl delete $secret -n $ns 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] Deleted $secret" -ForegroundColor Green
            }
        }
    }
    
    # Check for pending-upgrade secrets
    $secrets = kubectl get secrets -n $ns -l owner=helm,status=pending-upgrade -o name 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $secrets) {
        foreach ($secret in $secrets) {
            Write-Host "  [WARN] Found pending secret: $secret" -ForegroundColor Yellow
            kubectl delete $secret -n $ns 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] Deleted $secret" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""
Write-Host "[SUCCESS] Helm releases unlocked!" -ForegroundColor Green
Write-Host ""
Write-Host "[NEXT] Run terraform apply again:" -ForegroundColor Cyan
Write-Host "  terraform apply -auto-approve" -ForegroundColor White
Write-Host ""
