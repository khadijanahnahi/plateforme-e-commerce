# Ecommerce Boutique

Architecture initiale du projet :

- `frontend/` : application client en React + Vite
- `backend/` : API Spring Boot avec JWT, refresh token et PostgreSQL
- `backend/uploads/` : stockage local initial des images produits
- `docker-compose.yml` : base de données PostgreSQL pour le développement local

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
