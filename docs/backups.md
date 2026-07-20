# Sauvegardes de production ShopSphere

Ce dispositif sauvegarde PostgreSQL et MinIO sans arrêter les conteneurs. Il
produit des copies locales contrôlées, puis des copies datées dans un stockage
S3-compatible situé hors du VPS. Un volume Docker et un autre répertoire du
même VPS ne constituent jamais, à eux seuls, une sauvegarde de reprise après
sinistre.

## Architecture

```text
PostgreSQL container
  -> pg_dump custom + SHA-256
  -> /opt/shopsphere/backups/postgres
  -> S3/MinIO hors VPS /postgres/<timestamp>/

MinIO local
  -> copie des objets courants par bucket
  -> exports configuration + métadonnées buckets + IAM + SHA-256
  -> S3/MinIO hors VPS /minio/<timestamp>/
```

Chaque snapshot MinIO est écrit sous un nouveau préfixe UTC. Le script n'utilise
jamais `mc mirror --remove`. Le marqueur `_SUCCESS.json` n'est envoyé qu'après
la copie et les contrôles de nombre d'objets.

Le versioning protège les buckets MinIO sources contre les écrasements et
suppressions accidentels tant que le stockage source existe. Les snapshots
quotidiens hors site protègent contre la perte complète du VPS. `mc mirror`
copie l'état courant, pas tout l'historique des versions MinIO. Pour un RPO plus
strict ou une copie de chaque version, mettre en place une réplication MinIO
vers un second site en complément de ces snapshots.

## Données, fréquence et rétention

| Donnée | Fréquence | Local | Hors VPS |
|---|---:|---:|---:|
| PostgreSQL | chaque jour vers 02:00 | 14 jours | 90 jours |
| MinIO | chaque jour vers 03:00 | métadonnées, 14 jours | objets et métadonnées, 90 jours |
| Test de restauration PostgreSQL | le 1er de chaque mois vers 04:30 | base temporaire supprimée | non applicable |

Les délais aléatoires systemd évitent que tous les travaux commencent exactement
à la même seconde. Les valeurs sont configurables dans
`/etc/shopsphere/backup.env`.

Les buckets par défaut sont `products`, `categories`, `banners` et `invoices`.
La configuration Compose actuelle utilise par défaut `shopsphere-invoices` pour
les factures. `MINIO_BUCKETS` doit contenir le nom réellement configuré dans
`MINIO_BUCKET`; sinon le script s'arrête pour éviter une sauvegarde incomplète.

## Prérequis Ubuntu

Installer les outils système :

```bash
sudo apt-get update
sudo apt-get install -y curl jq shellcheck ca-certificates
```

Installer MinIO Client `mc` sur AMD64 :

```bash
curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc \
  -o /tmp/mc
sudo install -o root -g root -m 0755 /tmp/mc /usr/local/bin/mc
rm -f /tmp/mc
mc --version
```

Sur ARM64, remplacer `linux-amd64` par `linux-arm64`. En production, épingler
et vérifier le checksum d'une version validée de `mc`, idéalement proche de la
version du serveur MinIO.

## Installation

Le déploiement ci-dessous suppose que la version active du projet est disponible
sous `/opt/shopsphere/current`.

```bash
cd /opt/shopsphere/current
sudo install -d -o root -g root -m 0700 \
  /etc/shopsphere \
  /opt/shopsphere/backups/postgres \
  /opt/shopsphere/backups/minio \
  /var/log/shopsphere-backups \
  /var/lib/shopsphere-backups

sudo install -o root -g root -m 0600 \
  .backup.env.example /etc/shopsphere/backup.env
sudo editor /etc/shopsphere/backup.env

sudo chmod 0750 /opt/shopsphere/current/scripts/*.sh
sudo install -o root -g root -m 0644 \
  deploy/systemd/*.service deploy/systemd/*.timer /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now \
  shopsphere-postgres-backup.timer \
  shopsphere-minio-backup.timer \
  shopsphere-postgres-restore-test.timer
```

Vérifier les permissions :

```bash
sudo chown root:root /etc/shopsphere/backup.env
sudo chmod 600 /etc/shopsphere/backup.env
sudo stat -c '%U:%G %a %n' /etc/shopsphere/backup.env
```

La clé distante doit permettre uniquement l'accès au bucket de sauvegarde. La
clé source MinIO doit permettre lecture des buckets et export des métadonnées
administratives. Ne pas réutiliser les clés applicatives quand un compte de
sauvegarde dédié peut être créé.

## Initialiser le versioning MinIO

Cette commande crée uniquement les buckets absents, puis active et vérifie le
versioning sur chaque bucket configuré :

```bash
sudo BACKUP_ENV_FILE=/etc/shopsphere/backup.env \
  /opt/shopsphere/current/scripts/init-minio-versioning.sh
```

Contrôle manuel :

```bash
sudo -i
set -a
source /etc/shopsphere/backup.env
set +a
mc alias set source "$MINIO_SOURCE_URL" \
  "$MINIO_SOURCE_ACCESS_KEY" "$MINIO_SOURCE_SECRET_KEY"
for bucket in $MINIO_BUCKETS; do
  mc version info "source/$bucket"
done
exit
```

Cette commande interactive peut laisser l'alias dans le profil root. Le script
d'initialisation utilise, lui, une configuration temporaire supprimée à la fin.

## Commandes manuelles

Lancer et suivre les unités :

```bash
sudo systemctl start shopsphere-postgres-backup.service
sudo systemctl start shopsphere-minio-backup.service
sudo systemctl start shopsphere-postgres-restore-test.service

sudo systemctl status shopsphere-postgres-backup.service
sudo systemctl list-timers 'shopsphere-*'
sudo journalctl -u shopsphere-postgres-backup.service -n 100 --no-pager
sudo journalctl -u shopsphere-minio-backup.service -n 100 --no-pager
```

Logs dédiés :

```text
/var/log/shopsphere-backups/postgres.log
/var/log/shopsphere-backups/postgres-restore-test.log
/var/log/shopsphere-backups/minio.log
```

Dates et métriques du dernier succès :

```text
/var/lib/shopsphere-backups/postgres.last_success
/var/lib/shopsphere-backups/postgres.prom
/var/lib/shopsphere-backups/postgres-restore-test.last_success
/var/lib/shopsphere-backups/minio.last_success
/var/lib/shopsphere-backups/minio.prom
```

Si `BACKUP_MONITORING_URL` est renseignée, les scripts envoient un POST JSON
minimal à chaque succès ou échec. Aucun secret, nom de client ou contenu de
commande n'est envoyé.

## Restaurer et tester PostgreSQL

Vérifier le dernier dump dans une base temporaire puis la supprimer :

```bash
sudo BACKUP_ENV_FILE=/etc/shopsphere/backup.env \
  /opt/shopsphere/current/scripts/restore-postgres-test.sh \
  --latest --drop-after
```

Tester un dump précis sans supprimer la base temporaire :

```bash
sudo BACKUP_ENV_FILE=/etc/shopsphere/backup.env \
  /opt/shopsphere/current/scripts/restore-postgres-test.sh \
  /opt/shopsphere/backups/postgres/shopsphere-postgres-YYYYMMDDTHHMMSSZ.dump
```

Le script :

1. valide le SHA-256 ;
2. vérifie que l'archive custom est lisible ;
3. crée une base `shopsphere_restore_*` avec `template0` ;
4. exécute `pg_restore --exit-on-error` ;
5. vérifie `users`, `products`, `orders` et affiche leurs `COUNT` ;
6. ne cible jamais `POSTGRES_DB` pour la restauration.

Pour récupérer d'abord un dump hors site, configurer un alias `mc`, puis :

```bash
mc cp \
  offsite/shopsphere-production-backups/postgres/<timestamp>/shopsphere-postgres-<timestamp>.dump \
  /opt/shopsphere/backups/postgres/
mc cp \
  offsite/shopsphere-production-backups/postgres/<timestamp>/shopsphere-postgres-<timestamp>.dump.sha256 \
  /opt/shopsphere/backups/postgres/
```

Une restauration réelle doit être planifiée pendant une fenêtre de maintenance :
restaurer d'abord dans une nouvelle base, valider l'application, puis basculer
explicitement la connexion. Ne jamais remplacer directement la base active.

## Restaurer MinIO

Choisir un snapshot contenant `_SUCCESS.json`, créer les buckets de destination,
puis restaurer les objets sans `--remove` :

```bash
mc stat offsite/shopsphere-production-backups/minio/<timestamp>/_SUCCESS.json

for bucket in products categories banners invoices; do
  mc mb --ignore-existing "source/$bucket"
  mc mirror --retry \
    "offsite/shopsphere-production-backups/minio/<timestamp>/buckets/$bucket" \
    "source/$bucket"
done
```

Récupérer et vérifier les contrôles :

```bash
mkdir -p /root/shopsphere-minio-restore
mc mirror \
  offsite/shopsphere-production-backups/minio/<timestamp>/control \
  /root/shopsphere-minio-restore
cd /root/shopsphere-minio-restore
sha256sum --check SHA256SUMS
```

Après revue, restaurer les métadonnées avec les commandes MinIO adaptées à la
version installée :

```bash
mc admin config import source < metadata/minio-config.txt
mc admin cluster bucket import source metadata/minio-bucket-metadata.zip
mc admin cluster iam import source metadata/minio-iam.zip
```

L'import IAM peut remplacer ou ajouter des identités et politiques. Il doit être
effectué par un administrateur après inspection, jamais automatiquement par le
timer. Les variables d'environnement MinIO ont priorité sur certains paramètres
importés.

## Perte complète du VPS

1. Isoler l'ancien VPS et révoquer ses accès au stockage distant.
2. Créer un nouveau VPS Ubuntu, Docker et les versions compatibles.
3. Restaurer le dépôt et créer de nouveaux secrets de production.
4. Démarrer PostgreSQL et MinIO vides, sans ouvrir encore le trafic public.
5. Télécharger le dernier dump PostgreSQL et ses checksums depuis le stockage
   hors site.
6. Exécuter le test de restauration dans une base temporaire.
7. Restaurer vers une nouvelle base de production et lancer Flyway en validation.
8. Restaurer les buckets MinIO depuis un snapshot terminé.
9. Inspecter puis importer configuration, métadonnées buckets et IAM si requis.
10. Tester login, catalogue, commande, images et facture.
11. Basculer DNS/proxy uniquement après validation.
12. Faire tourner tous les secrets qui ont pu être présents sur le VPS perdu.

## Test mensuel

Le timer réalise automatiquement le test PostgreSQL. Une fois par mois :

1. vérifier que les trois timers ont réussi ;
2. restaurer PostgreSQL et contrôler les nombres de lignes ;
3. télécharger un snapshot MinIO dans un environnement isolé ;
4. ouvrir plusieurs images et une facture PDF ;
5. vérifier les checksums et le marqueur `_SUCCESS.json` ;
6. mesurer le temps de restauration et le comparer au RTO attendu ;
7. consigner la date, le résultat, le snapshot et l'opérateur.

Un backup qui n'a jamais été restauré avec succès doit être considéré comme non
validé.

## Rotation des secrets

- Créer des clés dédiées aux sauvegardes, avec privilèges minimaux.
- Faire tourner les clés source et distante périodiquement et après tout incident.
- Modifier uniquement `/etc/shopsphere/backup.env`, remettre `chmod 600`, puis
  lancer manuellement les deux services pour valider.
- Révoquer l'ancienne clé seulement après le succès du test.
- Ne jamais copier `.backup.env` dans Git, une image Docker, un ticket ou un log.

## Validation des scripts

```bash
cd /opt/shopsphere/current
shellcheck scripts/backup-postgres.sh \
  scripts/restore-postgres-test.sh \
  scripts/backup-minio.sh \
  scripts/init-minio-versioning.sh

bash -n scripts/backup-postgres.sh
bash -n scripts/restore-postgres-test.sh
bash -n scripts/backup-minio.sh
bash -n scripts/init-minio-versioning.sh
```

Les suppressions de rétention ne ciblent que des noms de snapshots conformes au
format UTC `YYYYMMDDTHHMMSSZ`. Tester d'abord avec une faible volumétrie et un
bucket distant réservé à la recette avant activation en production.
