# Ecommerce Boutique

Qualité et sécurité CI : voir [la configuration SonarQube et AI Code Assurance](docs/sonarqube.md).

Architecture initiale du projet :

- `frontend/` : application client en React + Vite
- `backend/` : API Spring Boot avec JWT, refresh token et PostgreSQL
- `backend/uploads/` : stockage local initial des images produits
- `docker-compose.yml` : base de données PostgreSQL pour le développement local

## Démarrage local

Le fichier `docker-compose.yml` garde les services de données sur le réseau interne.
Pour lancer la boutique complète localement :

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Le frontend est disponible sur `http://127.0.0.1:8088`. Les valeurs de `.env.example`
sont réservées au développement local; configurez des secrets uniques avant tout
déploiement. Le backend exige explicitement `JWT_SECRET` et `APP_ADMIN_PASSWORD`.

## Frontend

Structure prévue :

- `src/api` : appels HTTP
- `src/components` : composants partagés
- `src/features/auth` : connexion, stockage tokens, guards
- `src/features/products` : catalogue et détail produit
- `src/features/cart` : panier
- `src/features/orders` : commandes et suivi
- `src/pages` : pages principales
- `src/routes` : routage

## Backend

Structure modulaire Spring Boot :

- `auth`
- `user`
- `product`
- `category`
- `cart`
- `order`
- `stock`
- `dashboard`
- `blog` : CMS, publication programmée, taxonomies, médias et sitemap
- `upload`
- `security`
- `config`
- `common`

## Authentification

- access token JWT
- refresh token
- rôles `USER` et `ADMIN`

## Upload d'images

Les images sont stockées localement dans `backend/uploads/` au début du projet.

## Tests automatisés

### Tests backend rapides

Les tests unitaires historiques continuent d'utiliser H2 :

```powershell
cd backend
mvn test
```

### Intégration PostgreSQL avec Testcontainers

Les classes du package `integration` démarrent un PostgreSQL 16 Alpine temporaire,
appliquent toutes les migrations Flyway et utilisent `ddl-auto=validate`. Les emails
et les services externes sont désactivés dans le profil `integration`.

Docker Desktop doit être démarré avant la commande :

```powershell
cd backend
mvn -Dtest="*IntegrationTest" test
```

Si Docker n'est pas disponible, ces tests sont ignorés localement. Ils sont exécutés
dans GitHub Actions où Docker est disponible.

### Tests E2E Playwright

Installer Chromium une seule fois :

```powershell
cd frontend
npm run playwright:install
```

Démarrer le backend sur `8080`, puis lancer :

```powershell
cd frontend
npm run test:e2e
```

Playwright démarre automatiquement Vite sur `5173`. Les identifiants admin peuvent
être remplacés sans les écrire dans Git :

```powershell
$env:E2E_ADMIN_EMAIL="admin@shopsphere.local"
$env:E2E_ADMIN_PASSWORD="votre-mot-de-passe-local"
npm run test:e2e
```

Les scénarios créent des données uniques et doivent être exécutés contre une base de
test jetable, jamais directement contre la base de production. La CI démarre puis
supprime automatiquement une stack Docker et ses volumes pour chaque exécution.

## Blog / CMS

Le journal public est disponible sur `/blog`. Le back-office se trouve sous
`/admin/blog/posts`, avec des écrans séparés pour les catégories et les tags.
Seuls les articles `PUBLISHED` dont la date de publication est atteinte sont publics.
Le HTML produit par l'éditeur Tiptap est nettoyé côté serveur avant stockage.

Les images de couverture et de contenu acceptent uniquement JPEG, PNG et WEBP. En
Docker, elles sont stockées dans MinIO dans le bucket défini par
`MINIO_BLOG_BUCKET`. En développement local, le fallback est `backend/storage/blog`.
Le sitemap des articles publiés est exposé à `/sitemap.xml` derrière Nginx.

Variables principales :

```dotenv
APP_BLOG_STORAGE_PROVIDER=minio
MINIO_BLOG_BUCKET=shopsphere-media
APP_BLOG_MAX_IMAGE_SIZE=5242880
FRONTEND_URL=https://votre-domaine.example
```
