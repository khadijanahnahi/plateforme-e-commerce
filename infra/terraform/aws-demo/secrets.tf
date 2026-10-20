resource "aws_secretsmanager_secret" "runtime" {
  name                    = "${local.name_prefix}/runtime"
  description             = "Short-lived ShopSphere demo runtime secret."
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "runtime" {
  secret_id = aws_secretsmanager_secret.runtime.id
  secret_string = jsonencode({
    SPRING_DATASOURCE_USERNAME = "ecommerce_user"
    JWT_SECRET                 = random_id.jwt_secret.hex
    APP_EMAIL_FROM             = "no-reply@shopsphere.local"
  })
}

resource "random_id" "jwt_secret" {
  byte_length = 48
}
