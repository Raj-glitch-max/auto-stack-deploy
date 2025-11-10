# Quick Infrastructure Verification
Write-Host "`n=== AUTOSTACK QUICK VERIFICATION ===" -ForegroundColor Cyan

# S3 Bucket
Write-Host "`n[1/5] S3 Bucket..." -ForegroundColor Yellow
try {
    aws s3 ls s3://autostack-tfstate | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS: S3 bucket exists" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: S3 bucket not found" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL: Error checking S3" -ForegroundColor Red
}

# DynamoDB Table
Write-Host "`n[2/5] DynamoDB Table..." -ForegroundColor Yellow
try {
    $tables = aws dynamodb list-tables | ConvertFrom-Json
    if ($tables.TableNames -contains "autostack-tf-locks") {
        Write-Host "  PASS: DynamoDB table exists" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: DynamoDB table not found" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL: Error checking DynamoDB" -ForegroundColor Red
}

# IAM Role
Write-Host "`n[3/5] IAM Role..." -ForegroundColor Yellow
try {
    aws iam get-role --role-name AutoStackTerraformRole | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASS: IAM role exists" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: IAM role not found" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL: Error checking IAM role" -ForegroundColor Red
}

# Backend Health
Write-Host "`n[4/5] Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    if ($health.status -eq "healthy") {
        Write-Host "  PASS: Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Backend responded but not healthy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL: Backend not responding" -ForegroundColor Red
}

# Frontend
Write-Host "`n[5/5] Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  PASS: Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "  FAIL: Frontend not responding" -ForegroundColor Red
}

Write-Host "`n=== VERIFICATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. If any FAIL, run: .\scripts\setup-aws-infrastructure.ps1" -ForegroundColor Gray
Write-Host "  2. If backend/frontend FAIL, run: docker-compose up -d" -ForegroundColor Gray
Write-Host "  3. Run E2E tests: python tests/e2e/test_full_flow.py`n" -ForegroundColor Gray
