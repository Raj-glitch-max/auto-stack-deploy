variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "cluster_endpoint" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "enable_nginx_ingress" {
  type    = bool
  default = false
}

variable "enable_external_dns" {
  type    = bool
  default = false
}

variable "enable_cert_manager" {
  type    = bool
  default = false
}

variable "enable_loki" {
  type    = bool
  default = false
}

variable "enable_keda" {
  type    = bool
  default = false
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
