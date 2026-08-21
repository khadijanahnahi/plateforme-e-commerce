locals {
  buckets = {
    frontend = "${var.project}-frontend"
    media    = "${var.project}-media"
    invoices = "${var.project}-invoices"
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket = local.buckets.frontend
}

resource "aws_s3_bucket" "media" {
  bucket = local.buckets.media
}

resource "aws_s3_bucket" "invoices" {
  bucket = local.buckets.invoices
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_sqs_queue" "order_events_dlq" {
  name                      = "${var.project}-events-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "order_events" {
  name                       = "${var.project}-events"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_secretsmanager_secret" "runtime" {
  name                    = "${var.project}/runtime"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "runtime" {
  secret_id = aws_secretsmanager_secret.runtime.id
  secret_string = jsonencode({
    SPRING_DATASOURCE_USERNAME = "ecommerce_user"
    JWT_SECRET                 = "localstack-demo-secret-not-for-production"
    APP_EMAIL_FROM             = "no-reply@shopsphere.local"
  })
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/ecs/${var.project}/backend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/ecs/${var.project}/worker"
  retention_in_days = 14
}
