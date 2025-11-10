variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "database_url" {
  type    = string
  default = ""
}

variable "use_external_db" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
