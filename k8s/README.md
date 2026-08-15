# ShopSphere sur Kubernetes

Ces manifests servent d'abord a apprendre Kubernetes avec Kind. PostgreSQL et
MinIO pourront tourner dans le cluster local, mais seront remplaces par RDS et
S3 dans l'environnement AWS de production.

## Etape 1 : PostgreSQL local

Le mot de passe n'est pas versionne. Creez le Secret avant d'appliquer les
manifests :

```powershell
$postgresPassword = Read-Host "Mot de passe PostgreSQL local" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
kubectl create secret generic postgres-secret `
  --namespace shopsphere `
  --from-literal=POSTGRES_PASSWORD=$plainPassword
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
Remove-Variable plainPassword, postgresPassword, bstr
```

Appliquez et observez les ressources :

```powershell
kubectl apply -k k8s/base
kubectl rollout status statefulset/postgres -n shopsphere --timeout=120s
kubectl get pods,services,pvc -n shopsphere
```

Testez PostgreSQL depuis son Pod :

```powershell
kubectl exec -n shopsphere postgres-0 -- `
  psql -U ecommerce_user -d ecommerce_db -c "select current_database(), current_user;"
```

Testez ensuite la persistance : creez une table, supprimez le Pod et verifiez
que la table existe toujours apres sa recreation.

```powershell
kubectl exec -n shopsphere postgres-0 -- `
  psql -U ecommerce_user -d ecommerce_db -c "create table k8s_learning (id int primary key);"
kubectl delete pod postgres-0 -n shopsphere
kubectl wait --for=condition=Ready pod/postgres-0 -n shopsphere --timeout=120s
kubectl exec -n shopsphere postgres-0 -- `
  psql -U ecommerce_user -d ecommerce_db -c "\dt k8s_learning"
```

## Etape 2 : MinIO local

MinIO conserve ses objets dans un PVC. Ses identifiants ne sont pas dans les
manifests. Creez le Secret avant le premier deploiement :

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$minioPassword = [Convert]::ToBase64String($bytes)
$rng.Dispose()

kubectl create secret generic minio-secret `
  --namespace shopsphere `
  --from-literal=MINIO_ROOT_USER=shopsphere_minio `
  --from-literal=MINIO_ROOT_PASSWORD=$minioPassword

Remove-Variable bytes, minioPassword, rng
```

Appliquez les manifests et attendez le serveur puis le Job d'initialisation :

```powershell
kubectl apply -k k8s/base
kubectl rollout status statefulset/minio -n shopsphere --timeout=180s
kubectl wait --for=condition=complete job/minio-bootstrap `
  -n shopsphere --timeout=180s
kubectl logs job/minio-bootstrap -n shopsphere
kubectl get pods,services,pvc,jobs -n shopsphere
```

Le Job cree les buckets `shopsphere-invoices` et `shopsphere-media`, puis
active leur versioning. Le service reste interne au cluster sous
`http://minio:9000` ; aucun port hote n'est expose.

Pour ouvrir temporairement la console sur votre poste :

```powershell
kubectl port-forward service/minio 9001:9001 -n shopsphere
```

Ouvrez ensuite `http://127.0.0.1:9001`. Le port-forward est uniquement un outil
local et doit etre arrete apres le test.

Un smoke test verifie un cycle reel d'upload, download et suppression :

```powershell
kubectl delete job minio-smoke-test -n shopsphere --ignore-not-found
kubectl apply -f k8s/tests/minio-smoke-job.yaml
kubectl wait --for=condition=complete job/minio-smoke-test `
  -n shopsphere --timeout=120s
kubectl logs job/minio-smoke-test -n shopsphere
```

## Etape 3 : backend Spring Boot

Le backend utilise un compte MinIO dedie, distinct du compte root. Generez les
secrets locaux avant le premier deploiement :

```powershell
function New-RandomBase64([int]$size) {
  $bytes = New-Object byte[] $size
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  [Convert]::ToBase64String($bytes)
}

$jwtSecret = New-RandomBase64 64
$adminPassword = New-RandomBase64 24
$minioPassword = New-RandomBase64 32

kubectl create secret generic backend-secret `
  --namespace shopsphere `
  --from-literal=JWT_SECRET=$jwtSecret `
  --from-literal=APP_ADMIN_PASSWORD=$adminPassword `
  --from-literal=MINIO_ACCESS_KEY=shopsphere_backend `
  --from-literal=MINIO_SECRET_KEY=$minioPassword `
  "--from-literal=AWS_SES_SMTP_USERNAME=" `
  "--from-literal=AWS_SES_SMTP_PASSWORD="

Remove-Variable jwtSecret, adminPassword, minioPassword
Remove-Item function:New-RandomBase64
```

Construisez l'image et chargez-la directement dans Kind :

```powershell
docker build -t shopsphere-backend:local backend
kind load docker-image shopsphere-backend:local --name shopsphere
```

Le Job MinIO doit etre relance apres la creation du Secret backend afin de
creer son utilisateur de service :

```powershell
kubectl delete job minio-bootstrap -n shopsphere --ignore-not-found
kubectl apply -k k8s/base
kubectl wait --for=condition=complete job/minio-bootstrap `
  -n shopsphere --timeout=180s
kubectl rollout status deployment/backend -n shopsphere --timeout=240s
```

Verifiez les probes et les migrations Flyway :

```powershell
kubectl get pods,deployments,services -n shopsphere
kubectl logs deployment/backend -n shopsphere | Select-String "Flyway|Migrat"
kubectl exec -n shopsphere postgres-0 -- `
  psql -U ecommerce_user -d ecommerce_db -c 'select version, success from flyway_schema_history order by installed_rank;'
kubectl port-forward service/backend 18080:8080 -n shopsphere
```

Dans un autre terminal :

```powershell
Invoke-RestMethod http://127.0.0.1:18080/actuator/health
Invoke-RestMethod http://127.0.0.1:18080/actuator/health/readiness
```

Le meme controle peut etre execute entierement dans le cluster :

```powershell
kubectl delete job backend-smoke-test -n shopsphere --ignore-not-found
kubectl apply -f k8s/tests/backend-smoke-job.yaml
kubectl wait --for=condition=complete job/backend-smoke-test `
  -n shopsphere --timeout=120s
kubectl logs job/backend-smoke-test -n shopsphere
```

Le Service `backend` est de type `ClusterIP` : son port 8080 n'est accessible
que dans Kubernetes. Le port-forward est temporaire et sert uniquement au test
local.

## Etape 4 : frontend Nginx, Ingress et HTTPS local

Le frontend est construit avec `VITE_API_URL=/api`, servi par Nginx non-root et
expose uniquement par un Service `ClusterIP`. Nginx transmet `/api` au Service
interne `backend:8080`, conserve le rate limiting des routes d'authentification
et le support SSE.

Construisez l'image et chargez-la dans Kind :

```powershell
docker build -t shopsphere-frontend:local frontend
kind load docker-image shopsphere-frontend:local --name shopsphere
kubectl apply -k k8s/base
kubectl rollout status deployment/frontend -n shopsphere --timeout=180s
```

Installez le controleur Ingress Nginx puis creez un certificat local. La cle
privee est generee dans un conteneur temporaire et n'est jamais ecrite dans le
depot :

```powershell
.\k8s\scripts\install-ingress-nginx.ps1
.\k8s\scripts\create-local-tls.ps1
```

Le cluster Kind existant n'expose aucun port HTTP sur l'hote. Ouvrez donc un
terminal dedie et gardez ce port-forward actif :

```powershell
kubectl port-forward --namespace ingress-nginx `
  service/ingress-nginx-controller 8080:80 8443:443
```

Ajoutez une seule fois `127.0.0.1 shopsphere.local` au fichier Windows
`C:\Windows\System32\drivers\etc\hosts` avec des droits administrateur, puis
ouvrez `https://shopsphere.local:8443`. Le navigateur affiche un avertissement
normal car le certificat de developpement est auto-signe.

Executez les smoke tests du frontend et de l'Ingress :

```powershell
kubectl delete job frontend-smoke-test ingress-smoke-test `
  -n shopsphere --ignore-not-found
kubectl apply -f k8s/tests/frontend-smoke-job.yaml
kubectl apply -f k8s/tests/ingress-smoke-job.yaml
kubectl wait --for=condition=complete job/frontend-smoke-test `
  -n shopsphere --timeout=120s
kubectl wait --for=condition=complete job/ingress-smoke-test `
  -n shopsphere --timeout=120s
kubectl logs job/frontend-smoke-test -n shopsphere
kubectl logs job/ingress-smoke-test -n shopsphere
```

En production AWS, remplacez `shopsphere.local` par le domaine reel et le
Secret auto-signe par un certificat gere automatiquement avec cert-manager et
Let's Encrypt ou par AWS Load Balancer Controller avec ACM. Le frontend, le
backend, PostgreSQL et MinIO ne doivent jamais etre exposes directement.
