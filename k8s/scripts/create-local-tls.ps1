$ErrorActionPreference = "Stop"

$output = docker run --rm --entrypoint /bin/sh alpine/openssl -c `
  "openssl req -x509 -nodes -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -days 365 -subj '/CN=shopsphere.local' -addext 'subjectAltName=DNS:shopsphere.local' >/dev/null 2>&1; cat /tmp/tls.crt; echo __SHOPSPHERE_KEY__; cat /tmp/tls.key"

$parts = (($output -join "`n") -split "__SHOPSPHERE_KEY__")
if ($parts.Count -ne 2) {
  throw "La generation du certificat local a echoue."
}

$secret = @{
  apiVersion = "v1"
  kind = "Secret"
  metadata = @{
    name = "shopsphere-local-tls"
    namespace = "shopsphere"
  }
  type = "kubernetes.io/tls"
  data = @{
    "tls.crt" = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($parts[0].Trim()))
    "tls.key" = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($parts[1].Trim()))
  }
} | ConvertTo-Json -Depth 6

$secret | kubectl apply -f -
Remove-Variable output, parts, secret

Write-Host "Secret TLS local cree dans le namespace shopsphere."
