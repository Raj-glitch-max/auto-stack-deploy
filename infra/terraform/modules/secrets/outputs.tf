output "database_url_parameter" {
  value       = aws_ssm_parameter.database_url.name
  description = "SSM parameter name for database URL"
}

output "jwt_secret_parameter" {
  value       = aws_ssm_parameter.jwt_secret.name
  description = "SSM parameter name for JWT secret"
}

output "secret_key_parameter" {
  value       = aws_ssm_parameter.secret_key.name
  description = "SSM parameter name for secret key"
}

output "github_client_id_parameter" {
  value       = aws_ssm_parameter.github_client_id.name
  description = "SSM parameter name for GitHub client ID"
}

output "github_client_secret_parameter" {
  value       = aws_ssm_parameter.github_client_secret.name
  description = "SSM parameter name for GitHub client secret"
}

output "google_client_id_parameter" {
  value       = aws_ssm_parameter.google_client_id.name
  description = "SSM parameter name for Google client ID"
}

output "google_client_secret_parameter" {
  value       = aws_ssm_parameter.google_client_secret.name
  description = "SSM parameter name for Google client secret"
}

output "frontend_url_parameter" {
  value       = aws_ssm_parameter.frontend_url.name
  description = "SSM parameter name for frontend URL"
}

output "backend_url_parameter" {
  value       = aws_ssm_parameter.backend_url.name
  description = "SSM parameter name for backend URL"
}

output "jwt_secret_value" {
  value       = random_password.jwt_secret.result
  description = "Generated JWT secret value"
  sensitive   = true
}
