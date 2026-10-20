# ShopSphere AWS Network Demo

## Deployed Network

```text
VPC 10.0.0.0/16
  Public Subnet A  10.0.1.0/24   eu-west-3a
  Public Subnet B  10.0.2.0/24   eu-west-3b
  Private App A    10.0.11.0/24  eu-west-3a
  Private App B    10.0.12.0/24  eu-west-3b
  Private Data A   10.0.21.0/24  eu-west-3a
  Private Data B   10.0.22.0/24  eu-west-3b

Internet Gateway
  Public route table -> 0.0.0.0/0 through IGW

Private route tables
  No public internet route
  S3 Gateway VPC Endpoint attached

Security groups
  ALB SG   -> 80/443 from internet
  App SG   -> 8080 only from ALB SG
  Data SG  -> 5432 only from App SG
  Cache SG -> 6379 only from App SG
```

## Console Screenshots

Use region `Europe (Paris) eu-west-3`.

1. VPC: `shopsphere-demo-vpc`
2. Subnets: filter by `shopsphere-demo`
3. Route tables:
   - `shopsphere-demo-public-rt` has `0.0.0.0/0 -> igw`
   - private app/data route tables have no internet route
4. Internet gateways: `shopsphere-demo-igw`
5. Security groups:
   - `shopsphere-demo-alb-sg`
   - `shopsphere-demo-app-sg`
   - `shopsphere-demo-data-sg`
   - `shopsphere-demo-cache-sg`
6. VPC endpoints:
   - `shopsphere-demo-s3-gateway-endpoint`

## PowerShell Verification

```powershell
cd C:\Users\moham\Desktop\ecommerce\ecommerce-boutique

$region = "eu-west-3"
$outputs = terraform -chdir=infra\terraform\aws-demo output -json | ConvertFrom-Json
$vpcId = $outputs.network.value.vpc_id

aws ec2 describe-vpcs `
  --vpc-ids $vpcId `
  --region $region `
  --query "Vpcs[*].[VpcId,CidrBlock,State,IsDefault]" `
  --output table

aws ec2 describe-subnets `
  --filters "Name=vpc-id,Values=$vpcId" `
  --region $region `
  --query "Subnets[*].[Tags[?Key=='Name'].Value|[0],SubnetId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch]" `
  --output table

aws ec2 describe-route-tables `
  --filters "Name=vpc-id,Values=$vpcId" `
  --region $region `
  --query "RouteTables[*].[Tags[?Key=='Name'].Value|[0],RouteTableId,Routes[*].GatewayId]" `
  --output table

aws ec2 describe-security-groups `
  --filters "Name=vpc-id,Values=$vpcId" `
  --region $region `
  --query "SecurityGroups[*].[GroupName,GroupId,Description]" `
  --output table

aws ec2 describe-vpc-endpoints `
  --filters "Name=vpc-id,Values=$vpcId" `
  --region $region `
  --query "VpcEndpoints[*].[VpcEndpointId,ServiceName,VpcEndpointType,State]" `
  --output table
```

## Interview Explanation

```text
I provisioned a production-ready network foundation with Terraform:
public subnets for a future ALB, private app subnets for ECS services,
and isolated data subnets for RDS and Redis. Route tables separate public
and private traffic. Security groups enforce least privilege between tiers.
The S3 gateway endpoint allows private subnets to reach S3 without using
a NAT Gateway, keeping the demo low-cost while following production patterns.
```
