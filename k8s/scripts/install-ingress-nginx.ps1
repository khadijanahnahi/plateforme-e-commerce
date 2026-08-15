$ErrorActionPreference = "Stop"

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --version 4.15.1 `
  --namespace ingress-nginx `
  --create-namespace `
  --set controller.service.type=ClusterIP `
  --set controller.admissionWebhooks.enabled=true `
  --wait `
  --timeout 5m

kubectl get pods,services --namespace ingress-nginx
