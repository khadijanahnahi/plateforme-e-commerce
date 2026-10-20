locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = {
    Project     = "ShopSphere"
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "Terraform"
    Purpose     = "RecruiterDemo"
  }
}
