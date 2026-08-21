data "archive_file" "image_processor" {
  type        = "zip"
  source_file = "${path.module}/lambda/image_processor.py"
  output_path = "${path.module}/.terraform/image_processor.zip"
}

resource "aws_iam_role" "image_processor" {
  name = "${local.name_prefix}-image-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "image_processor_logs" {
  name = "${local.name_prefix}-image-processor-logs"
  role = aws_iam_role.image_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.image_processor.arn}:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "image_processor" {
  name              = "/aws/lambda/${local.name_prefix}-image-processor"
  retention_in_days = 1
}

resource "aws_lambda_function" "image_processor" {
  function_name    = "${local.name_prefix}-image-processor"
  description      = "Logs product image uploads from S3 for the ShopSphere recruiter demo."
  role             = aws_iam_role.image_processor.arn
  handler          = "image_processor.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.image_processor.output_path
  source_code_hash = data.archive_file.image_processor.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      PROJECT = "ShopSphere"
    }
  }

  depends_on = [aws_iam_role_policy.image_processor_logs]
}

resource "aws_lambda_permission" "allow_media_bucket" {
  statement_id  = "AllowExecutionFromMediaBucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.media.arn
}

resource "aws_s3_bucket_notification" "media" {
  bucket = aws_s3_bucket.media.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "products/"
  }

  depends_on = [aws_lambda_permission.allow_media_bucket]
}

