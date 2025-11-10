# ============================================
# AutoStack Terraform Makefile
# ============================================

.PHONY: help init plan apply destroy clean fmt validate

# Default target
.DEFAULT_GOAL := help

# Variables
TF := terraform
TF_VARS := -var-file="terraform.tfvars"

help: ## Show this help message
	@echo "AutoStack Terraform Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initialize Terraform
	@echo "Initializing Terraform..."
	$(TF) init -upgrade

fmt: ## Format Terraform files
	@echo "Formatting Terraform files..."
	$(TF) fmt -recursive

validate: ## Validate Terraform configuration
	@echo "Validating Terraform configuration..."
	$(TF) validate

plan: ## Plan Terraform changes
	@echo "Planning Terraform changes..."
	$(TF) plan $(TF_VARS)

apply: ## Apply Terraform changes
	@echo "Applying Terraform changes..."
	$(TF) apply $(TF_VARS) -auto-approve

destroy: ## Destroy Terraform resources
	@echo "Destroying Terraform resources..."
	$(TF) destroy $(TF_VARS) -auto-approve

clean: ## Clean Terraform files
	@echo "Cleaning Terraform files..."
	rm -rf .terraform .terraform.lock.hcl terraform.tfstate terraform.tfstate.backup

output: ## Show Terraform outputs
	@echo "Terraform outputs:"
	$(TF) output

kubeconfig: ## Update kubeconfig
	@echo "Updating kubeconfig..."
	@$(TF) output -raw configure_kubectl | sh

tf-init: init ## Alias for init
tf-plan: plan ## Alias for plan
tf-apply: apply ## Alias for apply
tf-destroy: destroy ## Alias for destroy
