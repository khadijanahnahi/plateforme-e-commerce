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
