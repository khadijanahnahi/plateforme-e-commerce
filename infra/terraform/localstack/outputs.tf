output "s3_buckets" {
  value = {
    frontend = aws_s3_bucket.frontend.bucket
    media    = aws_s3_bucket.media.bucket
    invoices = aws_s3_bucket.invoices.bucket
  }
}

output "order_events_queue_url" {
  value = aws_sqs_queue.order_events.url
}

output "order_events_dlq_url" {
  value = aws_sqs_queue.order_events_dlq.url
}

output "runtime_secret_name" {
  value = aws_secretsmanager_secret.runtime.name
}

output "cloudwatch_log_groups" {
  value = [
    aws_cloudwatch_log_group.backend.name,
    aws_cloudwatch_log_group.worker.name
  ]
}
