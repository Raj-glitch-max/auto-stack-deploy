# 🔧 Terraform Setup Guide

**Secure Infrastructure as Code with State Locking**

---

## 📋 Prerequisites

1. **AWS Account** with admin access
2. **Terraform** >= 1.0 installed
3. **AWS CLI** configured

---

## 🔐 Step 1: Create IAM Role (AssumeRole - Recommended)

**Why AssumeRole?**
- ✅ No long-lived credentials
- ✅ Automatic credential rotation
- ✅ Audit trail in CloudTrail
- ✅ Least privilege access

### **Create the IAM Role:**

```bash
# 1. Create trust policy file
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {}
    }
  ]
}
EOF

# 2. Create the role
aws iam create-role \
  --role-name AutoStackTerraformRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for AutoStack Terraform operations"

# 3. Attach the minimal policy (see below)
aws iam put-role-policy \
  --role-name AutoStackTerraformRole \
  --policy-name AutoStackTerraformPolicy \
  --policy-document file://terraform-policy.json

# 4. Get the role ARN (save this!)
aws iam get-role --role-name AutoStackTerraformRole --query 'Role.Arn' --output text
```

### **Minimal IAM Policy (`terraform-policy.json`):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::autostack-tfstate",
        "arn:aws:s3:::autostack-tfstate/*"
      ]
    },
    {
      "Sid": "TerraformStateLocking",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/autostack-tf-locks"
    },
    {
      "Sid": "EKSProvisioning",
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "ec2:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "iam:GetRole",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RDSProvisioning",
      "Effect": "Allow",
      "Action": [
        "rds:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRProvisioning",
      "Effect": "Allow",
      "Action": [
        "ecr:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "NetworkingProvisioning",
      "Effect": "Allow",
      "Action": [
        "route53:*",
        "acm:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🪣 Step 2: Create S3 Bucket for State

```bash
# Create S3 bucket
aws s3 mb s3://autostack-tfstate --region us-east-1

# Enable versioning (important for rollback)
aws s3api put-bucket-versioning \
  --bucket autostack-tfstate \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket autostack-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket autostack-tfstate \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable lifecycle policy (optional - keep last 30 versions)
aws s3api put-bucket-lifecycle-configuration \
  --bucket autostack-tfstate \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }]
  }'
```

---

## 🔒 Step 3: Create DynamoDB Table for Locking

```bash
# Create DynamoDB table
aws dynamodb create-table \
  --table-name autostack-tf-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --tags Key=Project,Value=AutoStack Key=ManagedBy,Value=Terraform

# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name autostack-tf-locks \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 🚀 Step 4: Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize with backend configuration
terraform init \
  -backend-config="bucket=autostack-tfstate" \
  -backend-config="key=autostack/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=autostack-tf-locks" \
  -backend-config="encrypt=true"

# Verify backend is configured
terraform show
```

---

## 🔄 Step 5: Configure Variables

Create `terraform.tfvars`:

```hcl
# AWS Configuration
aws_region          = "us-east-1"
aws_assume_role_arn = "arn:aws:iam::123456789012:role/AutoStackTerraformRole"
environment         = "production"

# EKS Configuration
eks_cluster_name    = "autostack-cluster"
eks_node_count      = 3
eks_instance_type   = "t3.medium"

# RDS Configuration
rds_instance_class  = "db.t3.micro"
rds_allocated_storage = 20
```

---

## ✅ Step 6: Test Configuration

```bash
# Validate configuration
terraform validate

# Plan changes (dry run)
terraform plan

# Apply changes (creates infrastructure)
terraform apply

# View state
terraform show

# List resources
terraform state list
```

---

## 🔐 Security Best Practices

### **1. Never Commit Credentials**
```bash
# Add to .gitignore
echo "*.tfvars" >> .gitignore
echo ".terraform/" >> .gitignore
echo "terraform.tfstate*" >> .gitignore
```

### **2. Use AssumeRole**
- ✅ Always use IAM role assumption
- ❌ Never use root account credentials
- ❌ Never use long-lived access keys

### **3. Enable Audit Logging**
```bash
# Enable CloudTrail for Terraform actions
aws cloudtrail create-trail \
  --name autostack-terraform-audit \
  --s3-bucket-name autostack-audit-logs
```

### **4. Rotate Credentials**
- IAM roles auto-rotate (no action needed)
- Review role permissions quarterly
- Remove unused roles

---

## 🚨 Troubleshooting

### **Error: "Error acquiring the state lock"**

**Cause:** Another Terraform process is running or crashed

**Solution:**
```bash
# List locks
aws dynamodb scan --table-name autostack-tf-locks

# Force unlock (use with caution!)
terraform force-unlock LOCK_ID
```

### **Error: "AccessDenied" on S3**

**Cause:** IAM role lacks S3 permissions

**Solution:**
```bash
# Verify role has S3 access
aws iam get-role-policy \
  --role-name AutoStackTerraformRole \
  --policy-name AutoStackTerraformPolicy
```

### **Error: "NoSuchBucket"**

**Cause:** S3 bucket doesn't exist

**Solution:**
```bash
# Create bucket
aws s3 mb s3://autostack-tfstate --region us-east-1
```

---

## 📊 State Management

### **View State**
```bash
terraform show
terraform state list
terraform state show aws_eks_cluster.main
```

### **Backup State**
```bash
# Manual backup
terraform state pull > backup.tfstate

# Restore from backup
terraform state push backup.tfstate
```

### **Migrate State**
```bash
# Migrate to new backend
terraform init -migrate-state
```

---

## 🎯 Next Steps

1. ✅ Create IAM role
2. ✅ Create S3 bucket
3. ✅ Create DynamoDB table
4. ✅ Initialize Terraform
5. ✅ Configure variables
6. ✅ Run `terraform plan`
7. ✅ Review changes
8. ✅ Run `terraform apply`

---

## 📞 Support

**Issues?**
- Check AWS CloudTrail logs
- Review Terraform logs: `TF_LOG=DEBUG terraform plan`
- Verify IAM permissions

**Cost Estimate:**
- S3 bucket: ~$0.023/GB/month
- DynamoDB: ~$0.25/month (on-demand)
- State locking: Nearly free (<1000 requests/month)

---

*Last Updated: November 10, 2025*
