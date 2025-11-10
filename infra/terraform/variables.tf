# ============================================
# AutoStack - Terraform Variables
# ============================================

# -------------------- General --------------------
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "autostack"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Optional domain name for Route53 and cert-manager"
  type        = string
  default     = ""
}

# -------------------- Networking --------------------
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# -------------------- EKS --------------------
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "use_spot_instances" {
  description = "Use spot instances for cost savings"
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 4
}

# -------------------- Database --------------------
variable "use_rds" {
  description = "Use RDS PostgreSQL instead of in-cluster DB"
  type        = bool
  default     = false
}

variable "use_aurora" {
  description = "Use Aurora Serverless v2 instead of RDS"
  type        = bool
  default     = false
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "autostack"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "autostack"
}

# -------------------- Jenkins --------------------
variable "jenkins_on_eks" {
  description = "Deploy Jenkins on EKS (true) or EC2 (false)"
  type        = bool
  default     = false
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins (if not on EKS)"
  type        = string
  default     = "t3.small"
}

# -------------------- Add-ons & Features --------------------
variable "enable_nginx_ingress" {
  description = "Enable NGINX Ingress Controller (in addition to ALB)"
  type        = bool
  default     = false
}

variable "enable_external_dns" {
  description = "Enable ExternalDNS for automatic DNS management"
  type        = bool
  default     = false
}

variable "enable_cert_manager" {
  description = "Enable cert-manager for automatic TLS certificates"
  type        = bool
  default     = false
}

variable "enable_loki" {
  description = "Enable Loki stack for log aggregation"
  type        = bool
  default     = false
}

variable "enable_keda" {
  description = "Enable KEDA for event-driven autoscaling"
  type        = bool
  default     = true
}

# -------------------- Monitoring & Alerts --------------------
variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts (optional)"
  type        = string
  default     = ""
}

# -------------------- Tags --------------------
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "AutoStack"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
