# Exposition réseau de production

## Architecture

Le fichier `docker-compose.yml` ne publie aucun service métier sur une
interface publique :

- PostgreSQL écoute uniquement dans le réseau Docker sur `postgres:5432` ;
- Spring Boot écoute uniquement dans le réseau Docker sur `backend:8080` ;
- la console MinIO `9001` n'est pas publiée ;
- l'API MinIO est liée à `127.0.0.1:9000` uniquement pour les sauvegardes
  exécutées sur le VPS ;
- le frontend Nginx est lié à `127.0.0.1:8088` et sert d'upstream au proxy TLS.

Deux réseaux Docker segmentent également les services : `edge` relie seulement
le frontend et le backend, tandis que `data`, marqué `internal`, relie le
backend à PostgreSQL et MinIO. Une compromission du frontend ne donne donc pas
un accès réseau direct aux services de données.

Le seul service destiné à Internet est le reverse proxy HTTPS installé sur le
VPS et écoutant sur `443/tcp`.

## Installation du proxy HTTPS

1. Installer Nginx et obtenir un certificat TLS valide pour le domaine.
2. Copier `deploy/nginx/shopsphere.conf.example` dans
   `/etc/nginx/sites-available/shopsphere.conf`.
3. Remplacer `shopsphere.example.com` et les chemins de certificats.
4. Activer le site puis vérifier et recharger Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/shopsphere.conf /etc/nginx/sites-enabled/shopsphere.conf
sudo nginx -t
sudo systemctl reload nginx
```

Le port upstream peut être modifié avec `SHOPSPHERE_PROXY_UPSTREAM_PORT`, mais
la même valeur doit être utilisée dans la directive `proxy_pass`.

## Pare-feu

Autoriser SSH et HTTPS seulement. Adapter le port SSH avant d'appliquer ces
commandes :

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Les ports `5433`, `8080`, `9000` et `9001` ne doivent jamais être autorisés par
le pare-feu public. Le port `9000` visible dans Compose est lié exclusivement à
la boucle locale et reste nécessaire au script `backup-minio.sh`.

## Vérification

Après démarrage :

```bash
docker compose ps
sudo ss -lntp
curl -I http://127.0.0.1:8088
curl -I https://shopsphere.example.com
```

Dans `ss`, aucun socket `0.0.0.0` ou `[::]` ne doit exister pour PostgreSQL,
Spring Boot ou MinIO. Le trafic public doit entrer uniquement par `443`.
