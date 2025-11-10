# AutoStack AWS Infrastructure Setup Script
# Creates all required AWS resources for Terraform backend

param(
    [string]$BucketName = "autostack-tfstate",
    [string]$TableName = "autostack-tf-locks",
    [string]$Region = "us-east-1",
    [string]$RoleName = "AutoStackTerraformRole"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 AUTOSTACK AWS INFRASTRUCTURE SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================
# 1. Create S3 Bucket
# ========================

Write-Host "📦 1. Creating S3 Bucket..." -ForegroundColor Yellow

try {
    # Check if bucket exists
    $bucketExists = aws s3 ls "s3://$BucketName" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ S3 bucket '$BucketName' already exists" -ForegroundColor Green
    } else {
        # Create bucket
        aws s3 mb "s3://$BucketName" --region $Region
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ S3 bucket '$BucketName' created" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to create S3 bucket" -ForegroundColor Red
            exit 1
        }
    }
    
    # Enable versioning
    Write-Host "   🔄 Enabling versioning..." -ForegroundColor Gray
    aws s3api put-bucket-versioning `
        --bucket $BucketName `
        --versioning-configuration Status=Enabled
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Versioning enabled" -ForegroundColor Green
    }
    
    # Enable encryption
    Write-Host "   🔒 Enabling encryption..." -ForegroundColor Gray
    $encryptionConfig = @"
{
    "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
        }
    }]
}
"@
    
    $encryptionConfig | aws s3api put-bucket-encryption `
        --bucket $BucketName `
        --server-side-encryption-configuration file:///dev/stdin
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Encryption enabled" -ForegroundColor Green
    }
    
    # Block public access
    Write-Host "   🚫 Blocking public access..." -ForegroundColor Gray
    aws s3api put-public-access-block `
        --bucket $BucketName `
        --public-access-block-configuration `
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Public access blocked" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   ❌ Error creating S3 bucket: $_" -ForegroundColor Red
    exit 1
}

# ========================
# 2. Create DynamoDB Table
# ========================

Write-Host "`n🔒 2. Creating DynamoDB Table..." -ForegroundColor Yellow

try {
    # Check if table exists
    $tableExists = aws dynamodb describe-table --table-name $TableName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ DynamoDB table '$TableName' already exists" -ForegroundColor Green
    } else {
        # Create table
        aws dynamodb create-table `
            --table-name $TableName `
            --attribute-definitions AttributeName=LockID,AttributeType=S `
            --key-schema AttributeName=LockID,KeyType=HASH `
            --billing-mode PAY_PER_REQUEST `
            --region $Region `
            --tags Key=Project,Value=AutoStack Key=ManagedBy,Value=Terraform
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ DynamoDB table '$TableName' created" -ForegroundColor Green
            Write-Host "   ⏳ Waiting for table to become active..." -ForegroundColor Gray
            
            # Wait for table to be active
            $maxWait = 60
            $waited = 0
            while ($waited -lt $maxWait) {
                $tableStatus = (aws dynamodb describe-table --table-name $TableName | ConvertFrom-Json).Table.TableStatus
                if ($tableStatus -eq "ACTIVE") {
                    Write-Host "   ✅ Table is now active" -ForegroundColor Green
                    break
                }
                Start-Sleep -Seconds 5
                $waited += 5
            }
        } else {
            Write-Host "   ❌ Failed to create DynamoDB table" -ForegroundColor Red
            exit 1
        }
    }
    
    # Enable point-in-time recovery
    Write-Host "   💾 Enabling point-in-time recovery..." -ForegroundColor Gray
    aws dynamodb update-continuous-backups `
        --table-name $TableName `
        --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Point-in-time recovery enabled" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   ❌ Error creating DynamoDB table: $_" -ForegroundColor Red
    exit 1
}

# ========================
# 3. Create IAM Role
# ========================

Write-Host "`n🔐 3. Creating IAM Role..." -ForegroundColor Yellow

try {
    # Check if role exists
    $roleExists = aws iam get-role --role-name $RoleName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ IAM role '$RoleName' already exists" -ForegroundColor Green
        $role = $roleExists | ConvertFrom-Json
        Write-Host "      ARN: $($role.Role.Arn)" -ForegroundColor Cyan
    } else {
        # Get AWS account ID
        $accountId = (aws sts get-caller-identity | ConvertFrom-Json).Account
        
        # Create trust policy
        $trustPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::${accountId}:root"
        },
        "Action": "sts:AssumeRole"
    }]
}
"@
        
        # Create role
        $trustPolicy | aws iam create-role `
            --role-name $RoleName `
            --assume-role-policy-document file:///dev/stdin `
            --description "Role for AutoStack Terraform operations"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ IAM role '$RoleName' created" -ForegroundColor Green
            
            # Get role ARN
            $role = aws iam get-role --role-name $RoleName | ConvertFrom-Json
            Write-Host "      ARN: $($role.Role.Arn)" -ForegroundColor Cyan
            Write-Host "`n   ⚠️  IMPORTANT: Save this ARN for Terraform configuration!" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Failed to create IAM role" -ForegroundColor Red
            exit 1
        }
        
        # Attach minimal policy
        Write-Host "   📋 Attaching minimal IAM policy..." -ForegroundColor Gray
        Write-Host "      (This will be created from docs/OPS-RUNBOOK.md policy)" -ForegroundColor Gray
        Write-Host "      → Manual step: Attach policy from runbook" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Error creating IAM role: $_" -ForegroundColor Red
    exit 1
}

# ========================
# Summary
# ========================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ S3 Bucket: $BucketName" -ForegroundColor Green
Write-Host "   ✅ DynamoDB Table: $TableName" -ForegroundColor Green
Write-Host "   ✅ IAM Role: $RoleName" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Attach IAM policy to role (see docs/OPS-RUNBOOK.md)" -ForegroundColor Yellow
Write-Host "   2. Update infrastructure/terraform/backend.tf with role ARN" -ForegroundColor Yellow
Write-Host "   3. Run: cd infrastructure/terraform && terraform init" -ForegroundColor Yellow
Write-Host "   4. Run: terraform plan" -ForegroundColor Yellow
Write-Host "   5. Run: terraform apply`n" -ForegroundColor Yellow

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Terraform Setup: infrastructure/terraform/SETUP.md" -ForegroundColor Gray
Write-Host "   - Operations Guide: docs/OPS-RUNBOOK.md" -ForegroundColor Gray
Write-Host "   - IAM Policy: docs/OPS-RUNBOOK.md#iam-setup`n" -ForegroundColor Gray
