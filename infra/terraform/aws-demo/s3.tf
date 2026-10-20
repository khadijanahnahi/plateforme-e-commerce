resource "random_id" "bucket_suffix" {
  byte_length = 4
}

locals {
  bucket_suffix = lower(random_id.bucket_suffix.hex)

  buckets = {
    frontend = "${local.name_prefix}-frontend-${local.bucket_suffix}"
    media    = "${local.name_prefix}-media-${local.bucket_suffix}"
    invoices = "${local.name_prefix}-invoices-${local.bucket_suffix}"
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket        = local.buckets.frontend
  force_destroy = true
}

resource "aws_s3_bucket" "media" {
  bucket        = local.buckets.media
  force_destroy = true
}

resource "aws_s3_bucket" "invoices" {
  bucket        = local.buckets.invoices
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  versioning_configuration {
    status = "Enabled"
  }
}
