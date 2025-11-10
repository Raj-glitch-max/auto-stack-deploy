output "database_url" {
  value = var.use_aurora ? "" : "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main[0].endpoint}/${var.db_name}"
  sensitive = true
}

output "db_endpoint" {
  value = var.use_aurora ? "" : aws_db_instance.main[0].endpoint
}

output "db_password" {
  value = random_password.db_password.result
  sensitive = true
}
