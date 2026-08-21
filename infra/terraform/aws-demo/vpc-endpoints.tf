resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    values(aws_route_table.private_app)[*].id,
    values(aws_route_table.private_data)[*].id
  )

  tags = {
    Name = "${local.name_prefix}-s3-gateway-endpoint"
  }
}

locals {
  interface_endpoint_services = toset([
    "sqs",
    "sns",
    "secretsmanager",
    "logs",
    "events"
  ])
}

resource "aws_vpc_endpoint" "interface" {
  for_each = var.enable_paid_interface_endpoints ? local.interface_endpoint_services : []

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = values(aws_subnet.private_app)[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name_prefix}-${each.key}-interface-endpoint"
  }
}

