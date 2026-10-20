# ShopSphere LocalStack Cloud Demo

This demo validates the AWS-style integration locally. It is not a production deployment.

## 1. Start LocalStack

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique
docker compose -f docker-compose.localstack.yml up -d localstack
```

## 2. Create AWS resources with Terraform

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique\infra\terraform\localstack
terraform init
terraform apply -auto-approve
```

Expected resources:

- S3 buckets: `shopsphere-frontend`, `shopsphere-media`, `shopsphere-invoices`
- SQS queues: `shopsphere-events`, `shopsphere-events-dlq`
- Secrets Manager secret: `shopsphere/runtime`
- CloudWatch log groups: `/aws/ecs/shopsphere/backend`, `/aws/ecs/shopsphere/worker`

## 3. Verify with awslocal

```powershell
awslocal s3 ls
awslocal sqs list-queues
awslocal secretsmanager list-secrets
awslocal logs describe-log-groups
```

If `awslocal` is not installed, use the standard AWS CLI:

```powershell
$env:AWS_ACCESS_KEY_ID="test"
$env:AWS_SECRET_ACCESS_KEY="test"
$env:AWS_DEFAULT_REGION="us-east-1"

aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
aws --endpoint-url=http://localhost:4566 logs describe-log-groups
```

## 4. Run the backend with the LocalStack profile

Start PostgreSQL as usual, then:

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique\backend
$env:SPRING_PROFILES_ACTIVE="localstack"
$env:AWS_ENDPOINT_URL="http://localhost:4566"
$env:APP_ORDER_EVENTS_QUEUE_URL="http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/shopsphere-events"
.\run-backend.ps1
```

On startup the backend should log that it loaded `shopsphere/runtime` from Secrets Manager.

## 5. Demonstrate backend integrations

Upload a product image from the admin UI. Verify it landed in S3:

```powershell
awslocal s3 ls s3://shopsphere-media/products/
```

Mark an order as paid or regenerate an invoice. Verify the PDF landed in S3:

```powershell
awslocal s3 ls s3://shopsphere-invoices/invoices/
```

Create or update an order. The backend publishes an event to SQS and the scheduled worker consumes it. Temporarily stop the backend before the worker consumes messages if you want to inspect the queue:

```powershell
awslocal sqs receive-message --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/shopsphere-events
```

This proves the Terraform resources exist and the Spring Boot app can use S3, SQS, Secrets Manager, and CloudWatch-compatible resource definitions locally.
