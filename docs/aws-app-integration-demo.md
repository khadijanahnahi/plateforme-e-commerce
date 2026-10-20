le # ShopSphere AWS App Integration Demo

This demo proves that actions in the ShopSphere app create visible AWS artifacts.

## 1. Apply AWS Demo Infrastructure

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique\infra\terraform\aws-demo
terraform apply
terraform output
```

Copy the output values for:

- `s3_buckets.media`
- `s3_buckets.invoices`
- `order_events_queue_url`
- `runtime_secret_name`

## 2. Run Backend Connected To Real AWS Demo

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique
.\scripts\run-backend-aws-demo.ps1
```

The backend should log that it loaded `shopsphere-demo/runtime` from Secrets Manager.

## 3. Product Image -> S3 Media Bucket

In the admin app:

1. Login as admin.
2. Open product creation/edit.
3. Upload a product image.
4. Save the product.

AWS Console screenshot:

- S3
- media bucket
- `products/` prefix
- uploaded object

CLI check:

```powershell
aws s3 ls s3://<media bucket>/products/ --region eu-west-3
```

## 4. Order Event -> SQS

In the app:

1. Login as a user.
2. Create an order.

AWS Console screenshot:

- SQS
- `shopsphere-demo-events`
- messages available > 0
- queue details showing DLQ redrive policy

CLI check:

```powershell
aws sqs get-queue-attributes `
  --queue-url "<order_events_queue_url from terraform output>" `
  --attribute-names ApproximateNumberOfMessages RedrivePolicy `
  --region eu-west-3
```

## 5. Paid Order Invoice -> S3 Invoices Bucket

In the admin app:

1. Open an order.
2. Mark payment as paid or regenerate invoice.

AWS Console screenshot:

- S3
- invoices bucket
- `invoices/` prefix
- generated PDF

CLI check:

```powershell
aws s3 ls s3://<invoices bucket>/invoices/ --region eu-west-3
```

## 6. Cleanup

After screenshots:

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique\infra\terraform\aws-demo
terraform destroy
```
