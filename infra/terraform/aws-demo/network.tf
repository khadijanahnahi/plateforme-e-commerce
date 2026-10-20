data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnets = {
    a = { cidr = "10.0.1.0/24", az_index = 0 }
    b = { cidr = "10.0.2.0/24", az_index = 1 }
  }

  private_app_subnets = {
    a = { cidr = "10.0.11.0/24", az_index = 0 }
    b = { cidr = "10.0.12.0/24", az_index = 1 }
  }

  private_data_subnets = {
    a = { cidr = "10.0.21.0/24", az_index = 0 }
    b = { cidr = "10.0.22.0/24", az_index = 1 }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = local.azs[each.value.az_index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${each.key}"
    Tier = "public"
  }
}

resource "aws_subnet" "private_app" {
  for_each = local.private_app_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = local.azs[each.value.az_index]

  tags = {
    Name = "${local.name_prefix}-private-app-${each.key}"
    Tier = "app"
  }
}

resource "aws_subnet" "private_data" {
  for_each = local.private_data_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = local.azs[each.value.az_index]

  tags = {
    Name = "${local.name_prefix}-private-data-${each.key}"
    Tier = "data"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-public-rt"
    Tier = "public"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_app" {
  for_each = aws_subnet.private_app

  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-private-app-${each.key}-rt"
    Tier = "app"
  }
}

resource "aws_route_table_association" "private_app" {
  for_each = aws_subnet.private_app

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_app[each.key].id
}

resource "aws_route_table" "private_data" {
  for_each = aws_subnet.private_data

  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-private-data-${each.key}-rt"
    Tier = "data"
  }
}

resource "aws_route_table_association" "private_data" {
  for_each = aws_subnet.private_data

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_data[each.key].id
}

