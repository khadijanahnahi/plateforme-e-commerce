resource "aws_cloudwatch_event_bus" "shopsphere" {
  name = "${local.name_prefix}-bus"
}

resource "aws_cloudwatch_event_rule" "order_created" {
  name           = "${local.name_prefix}-order-created"
  description    = "Routes ShopSphere order events to SQS and SNS for the recruiter demo."
  event_bus_name = aws_cloudwatch_event_bus.shopsphere.name

  event_pattern = jsonencode({
    source      = ["shopsphere.backend"]
    detail-type = ["ORDER_CREATED"]
  })
}

resource "aws_cloudwatch_event_target" "order_created_to_sqs" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.shopsphere.name
  target_id      = "shopsphere-order-events-sqs"
  arn            = aws_sqs_queue.order_events.arn
}

resource "aws_cloudwatch_event_target" "order_created_to_sns" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.shopsphere.name
  target_id      = "shopsphere-order-notifications-sns"
  arn            = aws_sns_topic.order_notifications.arn
}

