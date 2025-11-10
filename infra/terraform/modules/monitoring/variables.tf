variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "slack_webhook_url" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
