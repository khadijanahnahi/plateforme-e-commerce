# Notifications de commandes pour les administrateurs

## Flux

1. La commande est sauvegardee dans sa transaction metier.
2. `OrderCreatedEvent` est publie par le service de commande.
3. `AdminOrderNotificationListener` intervient uniquement `AFTER_COMMIT`.
4. `AdminNotificationService.createAndDispatch` utilise une transaction `REQUIRES_NEW`.
5. La notification est conservee en base, puis une livraison est creee pour chaque appareil actif.
6. Le worker envoie la Web Push. Un echec ne modifie jamais la commande et est retente avec backoff.
7. Le flux SSE actualise immediatement la cloche lorsque le back-office est ouvert.

La notification verrouillee ne contient ni nom, ni email, ni telephone, ni adresse du client.

## Generer les secrets

Generer une paire VAPID sur une machine de confiance :

```bash
npx --yes web-push generate-vapid-keys
```

Generer une cle AES de 32 octets pour chiffrer les abonnements en base :

```bash
openssl rand -base64 32
```

Renseigner uniquement `.env.production` sur le serveur :

```dotenv
APP_WEB_PUSH_ENABLED=true
APP_WEB_PUSH_PUBLIC_KEY=cle_publique_VAPID
APP_WEB_PUSH_PRIVATE_KEY=cle_privee_VAPID
APP_WEB_PUSH_SUBJECT=mailto:admin@votre-domaine.ma
APP_WEB_PUSH_STORAGE_ENCRYPTION_KEY=cle_base64_de_32_octets
```

Ne jamais changer la cle de chiffrement sans migrer ou reinitialiser les abonnements existants.
La cle privee VAPID et la cle de chiffrement ne doivent jamais etre exposees au frontend ou commitees.

## Activation sur un appareil

Dans la topbar admin, ouvrir la cloche puis cliquer sur **Activer**. La demande de permission du navigateur est donc declenchee par une action utilisateur.

- Android : utiliser Chrome sous HTTPS et autoriser les notifications.
- iPhone/iPad 16.4 ou plus recent : ajouter d'abord ShopSphere a l'ecran d'accueil, ouvrir l'application installee, puis activer les notifications depuis la cloche.
- Desktop : Chrome, Edge et Firefox compatibles peuvent recevoir les notifications hors de l'onglet.

HTTPS et un domaine valide sont obligatoires hors de `localhost`.

## Exploitation

- Les abonnements expirant avec HTTP 404/410 sont automatiquement desactives.
- Les erreurs temporaires sont retentees jusqu'a `APP_WEB_PUSH_MAX_ATTEMPTS`.
- Les commandes et notifications restent consultables meme si le fournisseur Push est indisponible.
- AWS SES doit rester un canal de secours pour les commandes importantes.
- Sur plusieurs instances backend, remplacer le broadcaster SSE en memoire par Redis Pub/Sub afin de diffuser entre instances.
