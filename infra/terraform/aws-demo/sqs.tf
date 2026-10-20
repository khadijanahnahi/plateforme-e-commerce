resource "aws_sqs_queue" "order_events_dlq" {
  name                      = "${local.name_prefix}-events-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "order_events" {
  name                       = "${local.name_prefix}-events"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "order_events" {
  queue_url = aws_sqs_queue.order_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowEventBridgeSendMessage"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.order_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.order_created.arn
          }
        }
      }
    ]
  })
}
