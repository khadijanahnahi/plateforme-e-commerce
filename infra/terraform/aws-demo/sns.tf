resource "aws_sns_topic" "order_notifications" {
  name = "${local.name_prefix}-order-notifications"
}

resource "aws_sqs_queue" "sns_notifications" {
  name                       = "${local.name_prefix}-sns-notifications"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
}

resource "aws_sqs_queue_policy" "sns_notifications" {
  queue_url = aws_sqs_queue.sns_notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSnsSendMessage"
        Effect    = "Allow"
        Principal = { Service = "sns.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.sns_notifications.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.order_notifications.arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "order_notifications_to_sqs" {
  topic_arn = aws_sns_topic.order_notifications.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.sns_notifications.arn
}

resource "aws_sns_topic_policy" "order_notifications" {
  arn = aws_sns_topic.order_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowEventBridgePublish"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.order_notifications.arn
      }
    ]
  })
}
