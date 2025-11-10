# AutoStack Infrastructure Verification Script
# Checks all infrastructure components are properly configured

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 AUTOSTACK INFRASTRUCTURE VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$results = @()

# ========================
# 1. S3 Backend Verification
# ========================

Write-Host "📦 1. Checking S3 Backend..." -ForegroundColor Yellow

try {
    $s3Check = aws s3 ls s3://autostack-tfstate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ S3 bucket 'autostack-tfstate' exists" -ForegroundColor Green
        $results += @{Test="S3 Bucket"; Status="PASS"}
        
        # Check versioning
        $versioning = aws s3api get-bucket-versioning --bucket autostack-tfstate 2>&1 | ConvertFrom-Json
        if ($versioning.Status -eq "Enabled") {
            Write-Host "   ✅ S3 versioning enabled" -ForegroundColor Green
            $results += @{Test="S3 Versioning"; Status="PASS"}
        } else {
            Write-Host "   ⚠️  S3 versioning not enabled" -ForegroundColor Yellow
            $results += @{Test="S3 Versioning"; Status="WARN"}
        }
        
        # Check encryption
        $encryption = aws s3api get-bucket-encryption --bucket autostack-tfstate 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ S3 encryption enabled" -ForegroundColor Green
            $results += @{Test="S3 Encryption"; Status="PASS"}
        } else {
            Write-Host "   ⚠️  S3 encryption not enabled" -ForegroundColor Yellow
            $results += @{Test="S3 Encryption"; Status="WARN"}
        }
    } else {
        Write-Host "   ❌ S3 bucket 'autostack-tfstate' NOT FOUND" -ForegroundColor Red
        Write-Host "   → Run: aws s3 mb s3://autostack-tfstate" -ForegroundColor Yellow
        $results += @{Test="S3 Bucket"; Status="FAIL"}
    }
} catch {
    Write-Host "   ❌ Error checking S3: $_" -ForegroundColor Red
    $results += @{Test="S3 Bucket"; Status="ERROR"}
}

# ========================
# 2. DynamoDB Lock Table
# ========================

Write-Host "`n🔒 2. Checking DynamoDB Lock Table..." -ForegroundColor Yellow

try {
    $tables = aws dynamodb list-tables 2>&1 | ConvertFrom-Json
    if ($tables.TableNames -contains "autostack-tf-locks") {
        Write-Host "   ✅ DynamoDB table 'autostack-tf-locks' exists" -ForegroundColor Green
        $results += @{Test="DynamoDB Table"; Status="PASS"}
        
        # Check table status
        $tableInfo = aws dynamodb describe-table --table-name autostack-tf-locks 2>&1 | ConvertFrom-Json
        if ($tableInfo.Table.TableStatus -eq "ACTIVE") {
            Write-Host "   ✅ Table status: ACTIVE" -ForegroundColor Green
            $results += @{Test="DynamoDB Status"; Status="PASS"}
        } else {
            Write-Host "   ⚠️  Table status: $($tableInfo.Table.TableStatus)" -ForegroundColor Yellow
            $results += @{Test="DynamoDB Status"; Status="WARN"}
        }
    } else {
        Write-Host "   ❌ DynamoDB table 'autostack-tf-locks' NOT FOUND" -ForegroundColor Red
        Write-Host "   → Run: aws dynamodb create-table --table-name autostack-tf-locks ..." -ForegroundColor Yellow
        $results += @{Test="DynamoDB Table"; Status="FAIL"}
    }
} catch {
    Write-Host "   ❌ Error checking DynamoDB: $_" -ForegroundColor Red
    $results += @{Test="DynamoDB Table"; Status="ERROR"}
}

# ========================
# 3. EKS Cluster
# ========================

Write-Host "`n☸️  3. Checking EKS Cluster..." -ForegroundColor Yellow

try {
    $clusters = aws eks list-clusters 2>&1 | ConvertFrom-Json
    if ($clusters.clusters.Count -gt 0) {
        Write-Host "   ✅ Found $($clusters.clusters.Count) EKS cluster(s):" -ForegroundColor Green
        foreach ($cluster in $clusters.clusters) {
            Write-Host "      - $cluster" -ForegroundColor Cyan
            $results += @{Test="EKS Cluster: $cluster"; Status="PASS"}
        }
    } else {
        Write-Host "   ⚠️  No EKS clusters found" -ForegroundColor Yellow
        Write-Host "   → This is OK if you haven't deployed yet" -ForegroundColor Gray
        $results += @{Test="EKS Cluster"; Status="PENDING"}
    }
} catch {
    Write-Host "   ⚠️  Error checking EKS (may not be deployed yet): $_" -ForegroundColor Yellow
    $results += @{Test="EKS Cluster"; Status="PENDING"}
}

# ========================
# 4. RDS Database
# ========================

Write-Host "`n🗄️  4. Checking RDS Database..." -ForegroundColor Yellow

try {
    $databases = aws rds describe-db-instances 2>&1 | ConvertFrom-Json
    if ($databases.DBInstances.Count -gt 0) {
        Write-Host "   ✅ Found $($databases.DBInstances.Count) RDS instance(s):" -ForegroundColor Green
        foreach ($db in $databases.DBInstances) {
            Write-Host "      - $($db.DBInstanceIdentifier) ($($db.DBInstanceStatus))" -ForegroundColor Cyan
            $results += @{Test="RDS: $($db.DBInstanceIdentifier)"; Status="PASS"}
        }
    } else {
        Write-Host "   ⚠️  No RDS instances found" -ForegroundColor Yellow
        Write-Host "   → This is OK if you haven't deployed yet" -ForegroundColor Gray
        $results += @{Test="RDS Database"; Status="PENDING"}
    }
} catch {
    Write-Host "   ⚠️  Error checking RDS (may not be deployed yet): $_" -ForegroundColor Yellow
    $results += @{Test="RDS Database"; Status="PENDING"}
}

# ========================
# 5. ECR Repository
# ========================

Write-Host "`n🐳 5. Checking ECR Repository..." -ForegroundColor Yellow

try {
    $repos = aws ecr describe-repositories 2>&1 | ConvertFrom-Json
    if ($repos.repositories.Count -gt 0) {
        Write-Host "   ✅ Found $($repos.repositories.Count) ECR repository(ies):" -ForegroundColor Green
        foreach ($repo in $repos.repositories) {
            Write-Host "      - $($repo.repositoryName)" -ForegroundColor Cyan
            $results += @{Test="ECR: $($repo.repositoryName)"; Status="PASS"}
        }
    } else {
        Write-Host "   ⚠️  No ECR repositories found" -ForegroundColor Yellow
        Write-Host "   → This is OK if you haven't deployed yet" -ForegroundColor Gray
        $results += @{Test="ECR Repository"; Status="PENDING"}
    }
} catch {
    Write-Host "   ⚠️  Error checking ECR (may not be deployed yet): $_" -ForegroundColor Yellow
    $results += @{Test="ECR Repository"; Status="PENDING"}
}

# ========================
# 6. IAM Role
# ========================

Write-Host "`n🔐 6. Checking IAM Role..." -ForegroundColor Yellow

try {
    $role = aws iam get-role --role-name AutoStackTerraformRole 2>&1 | ConvertFrom-Json
    if ($role.Role) {
        Write-Host "   ✅ IAM role 'AutoStackTerraformRole' exists" -ForegroundColor Green
        Write-Host "      ARN: $($role.Role.Arn)" -ForegroundColor Cyan
        $results += @{Test="IAM Role"; Status="PASS"}
    }
} catch {
    Write-Host "   ❌ IAM role 'AutoStackTerraformRole' NOT FOUND" -ForegroundColor Red
    Write-Host "   → Run: aws iam create-role --role-name AutoStackTerraformRole ..." -ForegroundColor Yellow
    $results += @{Test="IAM Role"; Status="FAIL"}
}

# ========================
# 7. Docker Services
# ========================

Write-Host "`n🐋 7. Checking Docker Services..." -ForegroundColor Yellow

try {
    $containers = docker ps --format "{{.Names}}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $containerList = $containers -split "`n" | Where-Object { $_ -match "autostack" }
        if ($containerList.Count -gt 0) {
            Write-Host "   ✅ Found $($containerList.Count) AutoStack container(s):" -ForegroundColor Green
            foreach ($container in $containerList) {
                Write-Host "      - $container" -ForegroundColor Cyan
            }
            $results += @{Test="Docker Containers"; Status="PASS"}
        } else {
            Write-Host "   ⚠️  No AutoStack containers running" -ForegroundColor Yellow
            Write-Host "   → Run: docker-compose up -d" -ForegroundColor Yellow
            $results += @{Test="Docker Containers"; Status="WARN"}
        }
    }
} catch {
    Write-Host "   ⚠️  Docker not running or not installed" -ForegroundColor Yellow
    $results += @{Test="Docker Containers"; Status="WARN"}
}

# ========================
# 8. Backend Health Check
# ========================

Write-Host "`n🏥 8. Checking Backend Health..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($health.status -eq "healthy") {
        Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
        $results += @{Test="Backend Health"; Status="PASS"}
    } else {
        Write-Host "   ⚠️  Backend responded but status: $($health.status)" -ForegroundColor Yellow
        $results += @{Test="Backend Health"; Status="WARN"}
    }
} catch {
    Write-Host "   ❌ Backend not responding on http://localhost:8000" -ForegroundColor Red
    Write-Host "   → Run: docker-compose up -d" -ForegroundColor Yellow
    $results += @{Test="Backend Health"; Status="FAIL"}
}

# ========================
# 9. Frontend Health Check
# ========================

Write-Host "`n🌐 9. Checking Frontend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
        $results += @{Test="Frontend Health"; Status="PASS"}
    }
} catch {
    Write-Host "   ❌ Frontend not responding on http://localhost:3000" -ForegroundColor Red
    Write-Host "   → Run: docker-compose up -d" -ForegroundColor Yellow
    $results += @{Test="Frontend Health"; Status="FAIL"}
}

# ========================
# 10. Database Connection
# ========================

Write-Host "`n🗃️  10. Checking Database Connection..." -ForegroundColor Yellow

try {
    $dbTest = docker exec autostack-db psql -U postgres -d autostack -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        $results += @{Test="Database Connection"; Status="PASS"}
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        $results += @{Test="Database Connection"; Status="FAIL"}
    }
} catch {
    Write-Host "   ⚠️  Could not check database (container may not be running)" -ForegroundColor Yellow
    $results += @{Test="Database Connection"; Status="WARN"}
}

# ========================
# Summary
# ========================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($results | Where-Object { $_.Status -eq "WARN" }).Count
$pending = ($results | Where-Object { $_.Status -eq "PENDING" }).Count
$total = $results.Count

Write-Host "✅ Passed:  $passed" -ForegroundColor Green
Write-Host "❌ Failed:  $failed" -ForegroundColor Red
Write-Host "⚠️  Warning: $warned" -ForegroundColor Yellow
Write-Host "⏳ Pending: $pending" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Total:   $total tests`n" -ForegroundColor Cyan

if ($failed -eq 0 -and $warned -eq 0) {
    Write-Host "🎉 ALL CRITICAL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "   Platform is ready for deployment!`n" -ForegroundColor Green
    exit 0
} elseif ($failed -eq 0) {
    Write-Host "⚠️  SOME WARNINGS FOUND" -ForegroundColor Yellow
    Write-Host "   Review warnings above and fix if needed`n" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ CRITICAL ISSUES FOUND" -ForegroundColor Red
    Write-Host "   Fix failed checks before deploying`n" -ForegroundColor Red
    exit 1
}
