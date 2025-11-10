# Force unlock Terraform state

Write-Host "[INFO] Force unlocking Terraform state..." -ForegroundColor Yellow
Write-Host ""

# The lock ID from the error message
$lockId = "c5b3075c-b80d-282c-0e41-b11f536d5522"

Write-Host "Lock ID: $lockId" -ForegroundColor Gray
Write-Host ""
Write-Host "[WARN] This will force unlock the state" -ForegroundColor Yellow
Write-Host "[WARN] Only do this if you're sure no other Terraform process is running" -ForegroundColor Yellow
Write-Host ""

# Force unlock
terraform force-unlock -force $lockId

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] State unlocked!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[NEXT] You can now run terraform apply" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to unlock state" -ForegroundColor Red
    exit 1
}
