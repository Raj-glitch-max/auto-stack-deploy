# 🔧 OPERATIONS RUNBOOK

**AutoStack Platform Operations Guide**

---

## 📋 TABLE OF CONTENTS

1. [IAM Setup](#iam-setup)
2. [Credential Rotation](#credential-rotation)
3. [Incident Response](#incident-response)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Backup & Recovery](#backup--recovery)
6. [Deployment Procedures](#deployment-procedures)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 IAM SETUP

### **Minimal IAM Policy (AssumeRole)**

**Use this policy for the AutoStack Terraform role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateManagement",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketVersioning"
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
      "Resource": "arn:aws:dynamodb:*:*:table/autostack-tf-locks"
    },
    {
      "Sid": "EKSClusterManagement",
      "Effect": "Allow",
      "Action": [
        "eks:CreateCluster",
        "eks:DeleteCluster",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:UpdateClusterConfig",
        "eks:UpdateClusterVersion",
        "eks:CreateNodegroup",
        "eks:DeleteNodegroup",
        "eks:DescribeNodegroup",
        "eks:UpdateNodegroupConfig"
      ],
      "Resource": "arn:aws:eks:*:*:cluster/autostack-*"
    },
    {
      "Sid": "EC2NetworkingForEKS",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:DescribeInternetGateways",
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2"]
        }
      }
    },
    {
      "Sid": "IAMRolesForEKS",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile"
      ],
      "Resource": [
        "arn:aws:iam::*:role/autostack-*",
        "arn:aws:iam::*:instance-profile/autostack-*"
      ]
    },
    {
      "Sid": "RDSDatabaseManagement",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBInstance",
        "rds:DeleteDBInstance",
        "rds:DescribeDBInstances",
        "rds:ModifyDBInstance",
        "rds:CreateDBSubnetGroup",
        "rds:DeleteDBSubnetGroup",
        "rds:DescribeDBSubnetGroups",
        "rds:AddTagsToResource",
        "rds:ListTagsForResource"
      ],
      "Resource": "arn:aws:rds:*:*:db:autostack-*"
    },
    {
      "Sid": "ECRRepositoryManagement",
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:PutImage",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:*:*:repository/autostack/*"
    },
    {
      "Sid": "LoadBalancerManagement",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:DeleteTargetGroup",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:AddTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Route53DNSManagement",
      "Effect": "Allow",
      "Action": [
        "route53:CreateHostedZone",
        "route53:DeleteHostedZone",
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ACMCertificateManagement",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DeleteCertificate",
        "acm:DescribeCertificate",
        "acm:ListCertificates",
        "acm:AddTagsToCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogsAndMetrics",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

### **Setup Commands:**

```bash
# 1. Create the IAM role
aws iam create-role \
  --role-name AutoStackTerraformRole \
  --assume-role-policy-document file://trust-policy.json

# 2. Attach the policy
aws iam put-role-policy \
  --role-name AutoStackTerraformRole \
  --policy-name AutoStackMinimalPolicy \
  --policy-document file://minimal-policy.json

# 3. Get the role ARN (save this!)
aws iam get-role \
  --role-name AutoStackTerraformRole \
  --query 'Role.Arn' \
  --output text
```

---

## 🔄 CREDENTIAL ROTATION

### **Rotate GitHub OAuth Secrets**

**Frequency:** Every 90 days

```bash
# 1. Generate new GitHub OAuth app credentials
# Go to: https://github.com/settings/developers

# 2. Update backend .env
GITHUB_CLIENT_ID=new_client_id
GITHUB_CLIENT_SECRET=new_secret

# 3. Restart backend
docker-compose restart backend

# 4. Test OAuth flow
curl http://localhost:8000/auth/github

# 5. Revoke old credentials in GitHub
```

### **Rotate Google OAuth Secrets**

**Frequency:** Every 90 days

```bash
# 1. Generate new credentials in Google Cloud Console
# Go to: https://console.cloud.google.com/apis/credentials

# 2. Update backend .env
GOOGLE_CLIENT_ID=new_client_id
GOOGLE_CLIENT_SECRET=new_secret

# 3. Restart backend
docker-compose restart backend

# 4. Test OAuth flow
curl http://localhost:8000/auth/google
```

### **Rotate JWT Secrets**

**Frequency:** Every 180 days

```bash
# 1. Generate new secrets
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Update backend .env
JWT_SECRET=new_secret
SECRET_KEY=new_secret

# 3. WARNING: This will invalidate all existing sessions
# Notify users before rotating

# 4. Restart backend
docker-compose restart backend
```

### **Rotate AWS IAM Role**

**Frequency:** Review quarterly, rotate if compromised

```bash
# 1. Create new role with same permissions
aws iam create-role \
  --role-name AutoStackTerraformRoleV2 \
  --assume-role-policy-document file://trust-policy.json

# 2. Attach policy
aws iam put-role-policy \
  --role-name AutoStackTerraformRoleV2 \
  --policy-name AutoStackMinimalPolicy \
  --policy-document file://minimal-policy.json

# 3. Update Terraform backend config
# In backend.tf, update assume_role_arn

# 4. Test Terraform
terraform plan

# 5. Delete old role
aws iam delete-role --role-name AutoStackTerraformRole
```

---

## 🚨 INCIDENT RESPONSE

### **Scenario 1: Deployment Failed**

**Symptoms:** Deployment stuck in "failed" status

**Steps:**
1. Check deployment logs
   ```bash
   kubectl logs -n autostack deployment/app-name
   ```

2. Check recent changes
   ```bash
   git log --oneline -10
   ```

3. Rollback deployment
   ```bash
   curl -X POST http://localhost:8000/api/deployments/{id}/rollback \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"reason": "Deployment failed"}'
   ```

4. Investigate root cause
   - Check application logs
   - Check resource limits
   - Check external dependencies

### **Scenario 2: Rate Limiting Triggered**

**Symptoms:** Users getting 429 errors

**Steps:**
1. Check rate limit logs
   ```bash
   docker logs autostack-backend | grep "rate_limit"
   ```

2. Identify offending IPs
   ```bash
   docker logs autostack-backend | grep "429" | awk '{print $1}' | sort | uniq -c
   ```

3. Temporarily block malicious IPs (if DDoS)
   ```bash
   # Add to nginx/firewall
   deny 1.2.3.4;
   ```

4. Increase rate limits if legitimate traffic
   ```python
   # In backend/middleware/rate_limit.py
   self.limits = {
       "/login": (20, 60),  # Increase from 10 to 20
   }
   ```

### **Scenario 3: OAuth Callback Failed**

**Symptoms:** Users can't login via GitHub/Google

**Steps:**
1. Check OAuth configuration
   ```bash
   curl http://localhost:8000/auth/github
   ```

2. Verify callback URLs match
   - GitHub: https://github.com/settings/developers
   - Google: https://console.cloud.google.com/apis/credentials

3. Check OAuth state validation
   ```bash
   docker logs autostack-backend | grep "oauth_state"
   ```

4. Test OAuth flow manually
   ```bash
   # Get OAuth URL
   curl http://localhost:8000/auth/github
   
   # Visit URL in browser
   # Check callback receives state parameter
   ```

### **Scenario 4: Database Connection Lost**

**Symptoms:** 500 errors, "database connection failed"

**Steps:**
1. Check database status
   ```bash
   docker ps | grep postgres
   docker logs autostack-db
   ```

2. Check connection string
   ```bash
   echo $DATABASE_URL
   ```

3. Restart database
   ```bash
   docker-compose restart db
   ```

4. Run migrations if needed
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### **Scenario 5: Terraform State Locked**

**Symptoms:** "Error acquiring the state lock"

**Steps:**
1. Check who has the lock
   ```bash
   aws dynamodb scan --table-name autostack-tf-locks
   ```

2. Verify no Terraform processes running
   ```bash
   ps aux | grep terraform
   ```

3. Force unlock (use with caution!)
   ```bash
   terraform force-unlock LOCK_ID
   ```

4. If lock persists, manually delete from DynamoDB
   ```bash
   aws dynamodb delete-item \
     --table-name autostack-tf-locks \
     --key '{"LockID": {"S": "autostack/terraform.tfstate"}}'
   ```

---

## 📊 MONITORING & ALERTS

### **Key Metrics to Monitor**

1. **Authentication**
   - Login success rate
   - OAuth callback success rate
   - Rate limit triggers
   - Account lockouts

2. **Deployments**
   - Deployment success rate
   - Average deployment time
   - Rollback frequency
   - Smoke test pass rate

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network traffic

4. **Database**
   - Connection pool usage
   - Query performance
   - Replication lag

### **Alert Thresholds**

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    severity: critical
    action: Page on-call engineer
  
  - name: Deployment Failure
    condition: deployment_failed
    severity: high
    action: Notify team + auto-rollback
  
  - name: Database Connection Pool Exhausted
    condition: db_connections > 90%
    severity: critical
    action: Scale database
  
  - name: High Rate Limiting
    condition: rate_limit_triggers > 100/min
    severity: medium
    action: Investigate potential DDoS
```

---

## 💾 BACKUP & RECOVERY

### **Database Backups**

**Automated Daily Backups:**
```bash
# Add to crontab
0 2 * * * docker exec autostack-db pg_dump -U postgres autostack > /backups/autostack-$(date +\%Y\%m\%d).sql
```

**Manual Backup:**
```bash
docker exec autostack-db pg_dump -U postgres autostack > backup.sql
```

**Restore from Backup:**
```bash
docker exec -i autostack-db psql -U postgres autostack < backup.sql
```

### **Terraform State Backups**

**S3 versioning is enabled automatically**

**Restore Previous State:**
```bash
# List versions
aws s3api list-object-versions \
  --bucket autostack-tfstate \
  --prefix autostack/terraform.tfstate

# Restore specific version
aws s3api get-object \
  --bucket autostack-tfstate \
  --key autostack/terraform.tfstate \
  --version-id VERSION_ID \
  terraform.tfstate
```

---

## 🚀 DEPLOYMENT PROCEDURES

### **Standard Deployment**

```bash
# 1. Pull latest code
git pull origin main

# 2. Run tests
pytest tests/

# 3. Build images
docker-compose build

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Restart services
docker-compose up -d

# 6. Verify health
curl http://localhost:8000/health
```

### **Rollback Procedure**

```bash
# 1. Identify last good deployment
git log --oneline

# 2. Revert to previous commit
git revert HEAD

# 3. Rebuild and restart
docker-compose build
docker-compose up -d

# 4. Verify health
curl http://localhost:8000/health
```

---

## 🔍 TROUBLESHOOTING

### **Common Issues**

**Issue:** Backend won't start  
**Solution:** Check environment variables, database connection

**Issue:** OAuth redirect fails  
**Solution:** Verify callback URLs match in OAuth provider settings

**Issue:** Terraform plan fails  
**Solution:** Check IAM permissions, state lock

**Issue:** Deployment stuck  
**Solution:** Check Kubernetes pod status, rollback if needed

---

## 📞 SUPPORT CONTACTS

- **On-Call Engineer:** [Your contact]
- **AWS Support:** [AWS support plan]
- **GitHub Support:** https://support.github.com
- **Google Cloud Support:** https://cloud.google.com/support

---

*Last Updated: November 10, 2025*
