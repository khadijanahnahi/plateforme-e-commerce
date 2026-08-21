variable "aws_region" {
  type        = string
  description = "AWS region for the short-lived demo resources."
  default     = "eu-west-3"
}

variable "project" {
  type        = string
  description = "Project prefix used in resource names."
  default     = "shopsphere"
}

variable "environment" {
  type        = string
  description = "Environment tag for the short-lived demo."
  default     = "demo"
}

variable "owner" {
  type        = string
  description = "Owner tag to make cleanup easy in AWS Console."
  default     = "mohamed"
}

variable "enable_paid_interface_endpoints" {
  type        = bool
  description = "Create paid interface VPC endpoints for private AWS API access. Keep false for the short-lived demo unless needed."
  default     = false
}
