# Secrets Management via SSM Parameter Store
resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/${var.environment}/database-url"
  type  = "SecureString"
  value = var.use_external_db ? var.database_url : "postgresql://autostack:autostack@postgres:5432/autostack"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-database-url"
    }
  )
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/${var.environment}/jwt-secret"
  type  = "SecureString"
  value = random_password.jwt_secret.result

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-jwt-secret"
    }
  )
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "google_client_id" {
  name  = "/${var.project_name}/${var.environment}/google-client-id"
  type  = "SecureString"
  value = "placeholder-update-after-deployment"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-google-client-id"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "google_client_secret" {
  name  = "/${var.project_name}/${var.environment}/google-client-secret"
  type  = "SecureString"
  value = "placeholder-update-after-deployment"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-google-client-secret"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "github_client_id" {
  name  = "/${var.project_name}/${var.environment}/github-client-id"
  type  = "SecureString"
  value = "placeholder-update-after-deployment"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-github-client-id"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "github_client_secret" {
  name  = "/${var.project_name}/${var.environment}/github-client-secret"
  type  = "SecureString"
  value = "placeholder-update-after-deployment"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-github-client-secret"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "secret_key" {
  name  = "/${var.project_name}/${var.environment}/secret-key"
  type  = "SecureString"
  value = random_password.jwt_secret.result

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-secret-key"
    }
  )
}

resource "aws_ssm_parameter" "frontend_url" {
  name  = "/${var.project_name}/${var.environment}/frontend-url"
  type  = "String"
  value = "http://localhost:3000"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-frontend-url"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "backend_url" {
  name  = "/${var.project_name}/${var.environment}/backend-url"
  type  = "String"
  value = "http://localhost:8000"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-backend-url"
    }
  )

  lifecycle {
    ignore_changes = [value]
  }
}
