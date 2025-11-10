# ============================================
# AutoStack - Main Terraform Configuration
# ============================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # S3 backend for state management
  backend "s3" {
    bucket         = "autostack-tfstate"
    key            = "eks/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "autostack-tf-locks"
  }
}

# -------------------- Provider Configuration --------------------
provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}

# -------------------- Data Sources --------------------
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# -------------------- Local Variables --------------------
locals {
  cluster_name = "${var.project_name}-${var.environment}-eks"
  account_id   = data.aws_caller_identity.current.account_id
  
  common_tags = merge(
    var.tags,
    {
      ClusterName = local.cluster_name
    }
  )
}

# -------------------- EKS Cluster Data Sources --------------------
# These data sources read the EKS cluster info for Kubernetes/Helm providers
data "aws_eks_cluster" "cluster" {
  name = local.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = local.cluster_name
}

# -------------------- Kubernetes & Helm Providers --------------------
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# -------------------- Modules --------------------
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

module "eks" {
  source = "./modules/eks"

  project_name        = var.project_name
  environment         = var.environment
  cluster_name        = local.cluster_name
  cluster_version     = var.eks_cluster_version
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  use_spot_instances  = var.use_spot_instances
  node_instance_types = var.node_instance_types
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  tags                = local.common_tags
}

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  tags         = local.common_tags
}

module "rds" {
  source = "./modules/rds"
  count  = var.use_rds || var.use_aurora ? 1 : 0

  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  use_aurora           = var.use_aurora
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  tags                 = local.common_tags
}

module "secrets" {
  source = "./modules/secrets"

  project_name    = var.project_name
  environment     = var.environment
  database_url    = var.use_rds || var.use_aurora ? module.rds[0].database_url : ""
  use_external_db = var.use_rds || var.use_aurora
  tags            = local.common_tags
}

module "jenkins" {
  source = "./modules/jenkins"
  count  = var.jenkins_on_eks ? 0 : 1

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  instance_type     = var.jenkins_instance_type
  ecr_repositories  = module.ecr.repository_urls
  tags              = local.common_tags
}

module "k8s_addons" {
  source = "./modules/k8s-addons"

  project_name         = var.project_name
  environment          = var.environment
  cluster_name         = module.eks.cluster_name
  cluster_endpoint     = module.eks.cluster_endpoint
  oidc_provider_arn    = module.eks.oidc_provider_arn
  vpc_id               = module.vpc.vpc_id
  enable_nginx_ingress = var.enable_nginx_ingress
  enable_external_dns  = var.enable_external_dns
  enable_cert_manager  = var.enable_cert_manager
  enable_loki          = var.enable_loki
  enable_keda          = var.enable_keda
  domain_name          = var.domain_name
  tags                 = local.common_tags

  depends_on = [module.eks]
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name      = var.project_name
  environment       = var.environment
  cluster_name      = module.eks.cluster_name
  alert_email       = var.alert_email
  slack_webhook_url = var.slack_webhook_url
  tags              = local.common_tags

  depends_on = [module.k8s_addons]
}
