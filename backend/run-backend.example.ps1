# Copy this file to run-backend.ps1 and replace placeholders with your real local values.
# Do not commit run-backend.ps1 because it contains secrets.

$env:CLOUDINARY_CLOUD_NAME = "your_cloudinary_cloud_name"
$env:CLOUDINARY_API_KEY = "your_cloudinary_api_key"
$env:CLOUDINARY_API_SECRET = "your_cloudinary_api_secret"
$env:CLOUDINARY_PRODUCT_FOLDER = "shopsphere/products"

# Keep false if you do not want to send real emails.
$env:APP_EMAIL_ENABLED = "false"
$env:APP_EMAIL_FROM = "no-reply@your-domain.com"
$env:APP_EMAIL_STORE_NAME = "ShopSphere"

# AWS SES SMTP settings.
$env:AWS_SES_SMTP_HOST = "email-smtp.eu-west-1.amazonaws.com"
$env:AWS_SES_SMTP_PORT = "587"
$env:AWS_SES_SMTP_USERNAME = "your_aws_ses_smtp_username"
$env:AWS_SES_SMTP_PASSWORD = "your_aws_ses_smtp_password"

mvn spring-boot:run
