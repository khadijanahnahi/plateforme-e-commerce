output "aws_region" {
  value = var.aws_region
}

output "s3_buckets" {
  value = {
    frontend = aws_s3_bucket.frontend.bucket
    media    = aws_s3_bucket.media.bucket
    invoices = aws_s3_bucket.invoices.bucket
  }
}

output "network" {
  value = {
    vpc_id              = aws_vpc.main.id
    internet_gateway_id = aws_internet_gateway.main.id
    public_subnet_ids   = values(aws_subnet.public)[*].id
    app_subnet_ids      = values(aws_subnet.private_app)[*].id
    data_subnet_ids     = values(aws_subnet.private_data)[*].id
    route_tables = {
      public       = aws_route_table.public.id
      private_app  = values(aws_route_table.private_app)[*].id
      private_data = values(aws_route_table.private_data)[*].id
    }
    s3_vpc_endpoint_id = aws_vpc_endpoint.s3.id
  }
}

output "security_groups" {
  value = {
    alb   = aws_security_group.alb.id
    app   = aws_security_group.app.id
    data  = aws_security_group.data.id
    cache = aws_security_group.cache.id
  }
}

output "order_events_queue_url" {
  value = aws_sqs_queue.order_events.url
}

output "order_events_dlq_url" {
  value = aws_sqs_queue.order_events_dlq.url
}

output "eventbridge_bus_name" {
  value = aws_cloudwatch_event_bus.shopsphere.name
}

output "sns_topic_arn" {
  value = aws_sns_topic.order_notifications.arn
}

output "sns_notifications_queue_url" {
  value = aws_sqs_queue.sns_notifications.url
}

output "lambda_image_processor_name" {
  value = aws_lambda_function.image_processor.function_name
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
