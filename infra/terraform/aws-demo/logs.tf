resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/ecs/${local.name_prefix}/backend"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/ecs/${local.name_prefix}/worker"
  retention_in_days = 1
}
