# ShopSphere AWS Event-Driven Demo

## Architecture

```text
Order created in Spring Boot
  -> EventBridge bus shopsphere-demo-bus
  -> SQS shopsphere-demo-events
  -> SNS shopsphere-demo-order-notifications
  -> SQS shopsphere-demo-sns-notifications

Product image uploaded to S3 media bucket
  -> S3 ObjectCreated notification
  -> Lambda shopsphere-demo-image-processor
  -> CloudWatch Logs
```

## Commands

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique

$region = "eu-west-3"
$outputs = terraform -chdir=infra\terraform\aws-demo output -json | ConvertFrom-Json
$bus = $outputs.eventbridge_bus_name.value
$mediaBucket = $outputs.s3_buckets.value.media
$orderQueueUrl = $outputs.order_events_queue_url.value
$snsQueueUrl = $outputs.sns_notifications_queue_url.value
$snsTopicArn = $outputs.sns_topic_arn.value
$lambdaName = $outputs.lambda_image_processor_name.value

terraform -chdir=infra\terraform\aws-demo output

aws events describe-event-bus `
  --name $bus `
  --region $region

aws events list-rules `
  --event-bus-name $bus `
  --region $region

aws events list-targets-by-rule `
  --event-bus-name $bus `
  --rule shopsphere-demo-order-created `
  --region $region

aws sns get-topic-attributes `
  --topic-arn $snsTopicArn `
  --region $region

aws sns list-subscriptions-by-topic `
  --topic-arn $snsTopicArn `
  --region $region

aws lambda get-function `
  --function-name $lambdaName `
  --region $region
```

## Manual EventBridge Test

```powershell
$orderId = "manual-demo-" + (Get-Date -Format "HHmmss")
$detailObj = @{
  type = "ORDER_CREATED"
  source = "shopsphere-backend"
  occurredAt = (Get-Date).ToUniversalTime().ToString("o")
  payload = @{ orderId = $orderId }
}

$entryObj = @(@{
  Source = "shopsphere.backend"
  DetailType = "ORDER_CREATED"
  Detail = ($detailObj | ConvertTo-Json -Compress)
  EventBusName = $bus
})

$tmp = Join-Path $env:TEMP "shopsphere-eventbridge-entry.json"
$json = ConvertTo-Json -InputObject $entryObj -Depth 10 -Compress
[System.IO.File]::WriteAllText($tmp, $json, [System.Text.UTF8Encoding]::new($false))

aws events put-events `
  --entries "file://$tmp" `
  --region $region

aws sqs receive-message `
  --queue-url $orderQueueUrl `
  --max-number-of-messages 5 `
  --visibility-timeout 5 `
  --wait-time-seconds 2 `
  --region $region

aws sqs receive-message `
  --queue-url $snsQueueUrl `
  --max-number-of-messages 5 `
  --visibility-timeout 5 `
  --wait-time-seconds 2 `
  --region $region
```

## Lambda S3 Trigger Test

```powershell
$key = "products/lambda-demo-" + (Get-Date -Format "HHmmss") + ".webp"

aws s3 cp `
  "frontend\images\hero-monochrome.webp" `
  "s3://$mediaBucket/$key" `
  --region $region

Start-Sleep -Seconds 10

$logGroup = "/aws/lambda/$lambdaName"
$stream = aws logs describe-log-streams `
  --log-group-name $logGroup `
  --order-by LastEventTime `
  --descending `
  --max-items 1 `
  --region $region `
  --query "logStreams[0].logStreamName" `
  --output text

aws logs get-log-events `
  --log-group-name $logGroup `
  --log-stream-name $stream `
  --limit 10 `
  --region $region `
  --query "events[*].message" `
  --output text
```

## App Demo

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique
.\scripts\run-backend-aws-demo.ps1
```

Then:

1. Upload a product image in admin. It appears in S3 and triggers Lambda.
2. Create an order in the shop. Spring Boot publishes `ORDER_CREATED` to EventBridge.
3. EventBridge routes the event to SQS and SNS.
4. SNS fan-out is visible in `shopsphere-demo-sns-notifications`.
