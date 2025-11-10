# ============================================
# AutoStack - Terraform Outputs
# ============================================

# -------------------- EKS Outputs --------------------
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = module.eks.cluster_version
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.eks.oidc_provider_arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

# -------------------- ECR Outputs --------------------
output "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend"
  value       = module.ecr.frontend_repository_url
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = module.ecr.backend_repository_url
}

# -------------------- Database Outputs --------------------
output "database_endpoint" {
  description = "Database endpoint"
  value       = var.use_rds || var.use_aurora ? module.rds[0].database_endpoint : "In-cluster PostgreSQL"
}

output "database_url_ssm_parameter" {
  description = "SSM parameter name for database URL"
  value       = module.secrets.database_url_parameter
}

# -------------------- Jenkins Outputs --------------------
output "jenkins_url" {
  description = "Jenkins URL"
  value       = var.jenkins_on_eks ? "Jenkins on EKS - check Ingress" : (length(module.jenkins) > 0 ? module.jenkins[0].jenkins_url : "Not deployed")
}

output "jenkins_instance_id" {
  description = "Jenkins EC2 instance ID (if not on EKS)"
  value       = var.jenkins_on_eks ? null : (length(module.jenkins) > 0 ? module.jenkins[0].jenkins_instance_id : null)
}

# -------------------- ArgoCD Outputs --------------------
output "argocd_server_url" {
  description = "ArgoCD server URL - Get with kubectl"
  value       = module.k8s_addons.argocd_server_url
}

output "argocd_namespace" {
  description = "ArgoCD namespace"
  value       = module.k8s_addons.argocd_namespace
}

output "argocd_initial_password_command" {
  description = "Command to get ArgoCD initial admin password"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}

# -------------------- Monitoring Outputs --------------------
# Prometheus/Grafana disabled due to resource constraints on t3.small
# output "grafana_url" {
#   description = "Grafana URL - Get with kubectl"
#   value       = module.k8s_addons.grafana_url
# }
# 
# output "prometheus_url" {
#   description = "Prometheus URL - Get with kubectl"
#   value       = module.k8s_addons.prometheus_url
# }
# 
# output "monitoring_namespace" {
#   description = "Monitoring namespace"
#   value       = module.k8s_addons.monitoring_namespace
# }

# -------------------- Service URLs --------------------
output "get_service_urls_command" {
  description = "Command to get all service LoadBalancer URLs"
  value       = "kubectl get svc -n argocd,monitoring --field-selector spec.type=LoadBalancer"
}

# -------------------- VPC Outputs --------------------
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# -------------------- SSM Parameters --------------------
output "ssm_parameters" {
  description = "SSM parameter names for secrets"
  value = {
    database_url       = module.secrets.database_url_parameter
    secret_key         = module.secrets.secret_key_parameter
    github_client_id   = module.secrets.github_client_id_parameter
    google_client_id   = module.secrets.google_client_id_parameter
    frontend_url       = module.secrets.frontend_url_parameter
    backend_url        = module.secrets.backend_url_parameter
  }
}

# -------------------- Quick Start --------------------
output "quick_start_commands" {
  description = "Quick start commands and service access"
  value = <<-EOT
    ========================================
    AutoStack EKS Deployment - Quick Start
    ========================================
    
    1. Configure kubectl:
       aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}
    
    2. Verify cluster:
       kubectl get nodes
       kubectl get pods -A
    
    3. Get ArgoCD password:
       kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
    
    4. Get service URLs:
       kubectl get svc -n argocd argocd-server
       kubectl get svc -n monitoring prometheus-grafana
       kubectl get svc -n monitoring prometheus-kube-prometheus-prometheus
    
    5. Access services (after getting LoadBalancer DNS):
       ArgoCD:     https://<ARGOCD_LB_DNS>
       Grafana:    http://<GRAFANA_LB_DNS>
       Prometheus: http://<PROMETHEUS_LB_DNS>
       Jenkins:    ${var.jenkins_on_eks ? "Check Ingress" : (length(module.jenkins) > 0 ? module.jenkins[0].jenkins_url : "Not deployed")}
    
    6. Deploy AutoStack apps:
       kubectl apply -f ../../argocd/apps/root.yaml
       kubectl get applications -n argocd
    
    ========================================
  EOT
}
