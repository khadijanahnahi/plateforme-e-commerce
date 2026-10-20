$vars = @{}
Get-Content "$PSScriptRoot\run-backend.ps1" | ForEach-Object {
    if ($_ -match '^\$env:([A-Z0-9_]+)\s*=\s*"(.*)"') {
        $vars[$matches[1]] = $matches[2]
    }
}

$required = @(
    "APP_EMAIL_FROM",
    "AWS_SES_SMTP_HOST",
    "AWS_SES_SMTP_PORT",
    "AWS_SES_SMTP_USERNAME",
    "AWS_SES_SMTP_PASSWORD"
)
$missing = $required | Where-Object { [string]::IsNullOrWhiteSpace($vars[$_]) }
if ($missing.Count -gt 0) {
    Write-Output ("SMTP_CONFIG_MISSING: " + ($missing -join ", "))
    exit 2
}

try {
    $message = [System.Net.Mail.MailMessage]::new()
    $message.From = $vars["APP_EMAIL_FROM"]
    $message.To.Add("mohamed07elm@gmail.com")
    $message.Subject = "ShopSphere SMTP local test"
    $message.Body = "This is a local SMTP test from ShopSphere at $(Get-Date -Format s)."

    $client = [System.Net.Mail.SmtpClient]::new($vars["AWS_SES_SMTP_HOST"], [int]$vars["AWS_SES_SMTP_PORT"])
    $client.EnableSsl = $true
    $client.Credentials = [System.Net.NetworkCredential]::new(
        $vars["AWS_SES_SMTP_USERNAME"],
        $vars["AWS_SES_SMTP_PASSWORD"]
    )
    $client.Send($message)
    Write-Output "SMTP_TEST_SENT"
} catch {
    Write-Output "SMTP_TEST_FAILED"
    Write-Output $_.Exception.GetType().FullName
    Write-Output $_.Exception.Message
    if ($_.Exception.InnerException) {
        Write-Output $_.Exception.InnerException.GetType().FullName
        Write-Output $_.Exception.InnerException.Message
    }
    exit 1
}
