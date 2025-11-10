variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "use_aurora" {
  type    = bool
  default = false
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_name" {
  type    = string
  default = "autostack"
}

variable "db_username" {
  type    = string
  default = "autostack_admin"
}

variable "tags" {
  type    = map(string)
  default = {}
}
