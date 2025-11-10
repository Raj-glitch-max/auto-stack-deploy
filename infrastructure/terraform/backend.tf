# Terraform Backend Configuration
# Enables remote state storage with locking to prevent concurrent modifications

terraform {
  backend "s3" {
    # S3 bucket for state storage (REPLACE WITH YOUR BUCKET)
    bucket = "autostack-tfstate"
    
    # State file path within the bucket
    key    = "autostack/terraform.tfstate"
    
    # AWS region where the S3 bucket is located
    region = "us-east-1"
    
    # DynamoDB table for state locking (REPLACE WITH YOUR TABLE)
    dynamodb_table = "autostack-tf-locks"
    
    # Enable encryption at rest
    encrypt = true
    
    # Optional: Use specific AWS profile
    # profile = "autostack"
    
    # Optional: Server-side encryption with AWS KMS
    # kms_key_id = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
  }
  
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
  
  # Use AssumeRole instead of long-lived credentials
  assume_role {
    role_arn     = var.aws_assume_role_arn
    session_name = "autostack-terraform"
  }
  
  default_tags {
    tags = {
      Project     = "AutoStack"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_assume_role_arn" {
  description = "IAM role ARN to assume for Terraform operations"
  type        = string
  # Example: "arn:aws:iam::123456789012:role/AutoStackTerraformRole"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

# Outputs
output "backend_config" {
  description = "Backend configuration details"
  value = {
    bucket         = "autostack-tfstate"
    dynamodb_table = "autostack-tf-locks"
    region         = var.aws_region
  }
}
