$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendRoot = Join-Path $projectRoot "backend"
$terraformRoot = Join-Path $projectRoot "infra\terraform\aws-demo"

if (-not (Test-Path $terraformRoot)) {
    throw "Terraform aws-demo directory not found: $terraformRoot"
}
if ([string]::IsNullOrWhiteSpace($env:APP_ADMIN_PASSWORD)) {
    throw "Set APP_ADMIN_PASSWORD in the environment before running this demo."
}

$outputsJson = terraform -chdir="$terraformRoot" output -json
$outputs = $outputsJson | ConvertFrom-Json

$env:SPRING_PROFILES_ACTIVE = "aws-demo"
$env:AWS_REGION = $outputs.aws_region.value
$env:APP_PRODUCT_MEDIA_S3_BUCKET = $outputs.s3_buckets.value.media
$env:APP_PRODUCT_MEDIA_PUBLIC_URL_PREFIX = "/api/media"
$env:APP_INVOICE_S3_BUCKET = $outputs.s3_buckets.value.invoices
$env:APP_ORDER_EVENTS_QUEUE_URL = $outputs.order_events_queue_url.value
$env:APP_EVENTBRIDGE_BUS_NAME = $outputs.eventbridge_bus_name.value
$env:APP_RUNTIME_SECRET_NAME = $outputs.runtime_secret_name.value
$env:APP_CLOUD_SQS_WORKER_ENABLED = "false"
$env:APP_ADMIN_RESET_PASSWORD = "true"
$env:APP_REFRESH_COOKIE_SECURE = "false"
$env:APP_REFRESH_COOKIE_SAME_SITE = "Lax"
$env:JWT_ACCESS_TOKEN_EXPIRATION_MS = "3600000"

Write-Host "Starting ShopSphere backend with AWS demo resources:"
Write-Host "  Region: $env:AWS_REGION"
Write-Host "  Product media bucket: $env:APP_PRODUCT_MEDIA_S3_BUCKET"
Write-Host "  Product media public URL prefix: $env:APP_PRODUCT_MEDIA_PUBLIC_URL_PREFIX"
Write-Host "  Invoice bucket: $env:APP_INVOICE_S3_BUCKET"
Write-Host "  SQS queue: $env:APP_ORDER_EVENTS_QUEUE_URL"
Write-Host "  EventBridge bus: $env:APP_EVENTBRIDGE_BUS_NAME"
Write-Host "  Runtime secret: $env:APP_RUNTIME_SECRET_NAME"
Write-Host "  Admin login: admin@shopsphere.local (password supplied through APP_ADMIN_PASSWORD)"
Write-Host ""

Push-Location $backendRoot
try {
    & ".\run-backend.ps1"
} finally {
    Pop-Location
}
