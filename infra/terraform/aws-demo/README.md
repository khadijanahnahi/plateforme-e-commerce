# ShopSphere AWS Demo

Short-lived real AWS environment for recruiter screenshots.

It creates only low-cost, easy-to-destroy resources:

- 3 S3 buckets
- SQS queue + DLQ
- Secrets Manager secret
- 2 CloudWatch Logs groups

It intentionally does not create NAT Gateway, RDS, ECS, ALB, CloudFront, or Route 53.

## 1. Configure AWS CLI

```powershell
aws configure
aws sts get-caller-identity
```

Check that the account ID is the account you want to use for the demo.

## 2. Plan

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique\infra\terraform\aws-demo
terraform init
terraform plan
```

## 3. Apply

```powershell
terraform apply
```

Take screenshots of:

- `Apply complete!`
- Terraform outputs
- S3 buckets
- SQS queue and DLQ
- Secrets Manager secret
- CloudWatch log groups
- architecture diagram in `docs/aws-demo-screenshots.md`

## 4. Destroy

```powershell
terraform destroy
```

Take a screenshot of `Destroy complete!`.

## 5. Verify Cleanup

```powershell
aws s3 ls | Select-String shopsphere-demo
aws sqs list-queues --queue-name-prefix shopsphere-demo
aws secretsmanager list-secrets --filters Key=name,Values=shopsphere-demo
aws logs describe-log-groups --log-group-name-prefix /aws/ecs/shopsphere-demo
```

These commands should return no remaining demo resources after destroy.
