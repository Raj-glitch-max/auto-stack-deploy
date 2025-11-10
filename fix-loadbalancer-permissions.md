# Fix AWS Load Balancer IAM Permissions

## Issue

The AWS Load Balancer Controller is missing IAM permissions to create Load Balancers.

**Error:**
```
AccessDenied: User: arn:aws:sts::367749063363:assumed-role/autostack-prod-alb-controller
is not authorized to perform: elasticloadbalancing:AddTags
```

## Solution

Add the missing permission to the ALB controller IAM role.

### Step 1: Get the Role ARN

```bash
kubectl get serviceaccount aws-load-balancer-controller -n kube-system -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
```

### Step 2: Create IAM Policy

Create file `alb-addtags-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:AddTags",
        "elasticloadbalancing:RemoveTags",
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:DeleteTargetGroup",
        "elasticloadbalancing:ModifyLoadBalancerAttributes",
        "elasticloadbalancing:ModifyTargetGroup",
        "elasticloadbalancing:ModifyTargetGroupAttributes",
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets",
        "elasticloadbalancing:SetSecurityGroups",
        "elasticloadbalancing:SetSubnets"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Attach Policy

```bash
# Create policy
aws iam create-policy \
  --policy-name ALBControllerAdditionalPermissions \
  --policy-document file://alb-addtags-policy.json

# Get role name
ROLE_NAME=$(kubectl get serviceaccount aws-load-balancer-controller -n kube-system \
  -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}' | cut -d'/' -f2)

# Attach policy to role
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::367749063363:policy/ALBControllerAdditionalPermissions
```

### Step 4: Restart Controller

```bash
kubectl rollout restart deployment aws-load-balancer-controller -n kube-system
```

### Step 5: Recreate Services

```bash
# Delete services
kubectl delete svc autostack-frontend autostack-backend -n default

# Wait for ArgoCD to recreate (60 seconds)
kubectl get svc -n default -w
```

### Step 6: Get Public URLs

```bash
# Wait for EXTERNAL-IP (2-3 minutes)
kubectl get svc -n default

# Get URLs
FRONTEND_URL=$(kubectl get svc autostack-frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
BACKEND_URL=$(kubectl get svc autostack-backend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Frontend: http://$FRONTEND_URL"
echo "Backend: http://$BACKEND_URL"
```

## Alternative: Use Default Cloud Provider

Instead of the AWS Load Balancer Controller, use the default Kubernetes cloud provider:

```bash
# Remove ALB controller (optional)
helm uninstall aws-load-balancer-controller -n kube-system

# Services will automatically use Classic Load Balancer
# No special annotations needed
```

## Cost Impact

- **Classic Load Balancer**: ~$18/month per LB = $36/month for 2
- **Network Load Balancer**: ~$16/month per NLB = $32/month for 2
- **Application Load Balancer**: ~$16/month per ALB = $16/month (can handle multiple apps)

## Status

- ❌ LoadBalancer creation currently fails due to IAM permissions
- ✅ Port-forwarding + ngrok works perfectly (use this for now!)
- 🔧 Fix pending: Add IAM permissions to ALB controller role

## Next Steps

1. Use quick-public-access.ps1 for immediate access
2. Run this fix later when you want permanent AWS Load Balancers
3. Or proceed with Jenkins CI/CD setup using port-forwarding
