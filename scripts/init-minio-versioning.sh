#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-/etc/shopsphere/backup.env}"
[[ -r "$BACKUP_ENV_FILE" ]] || {
  printf 'ERROR: backup environment file is not readable: %s\n' "$BACKUP_ENV_FILE" >&2
  exit 1
}

mode="$(stat -c '%a' "$BACKUP_ENV_FILE")"
if (( (8#$mode & 077) != 0 )); then
  printf 'ERROR: %s must have chmod 600 or stricter\n' "$BACKUP_ENV_FILE" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$BACKUP_ENV_FILE"

MC_BIN="${MC_BIN:-/usr/local/bin/mc}"
MINIO_SOURCE_ALIAS="${MINIO_SOURCE_ALIAS:-shopsphere-source}"
MINIO_BUCKETS="${MINIO_BUCKETS:-products categories banners invoices}"
MINIO_INSECURE="${MINIO_INSECURE:-false}"

: "${MINIO_SOURCE_URL:?MINIO_SOURCE_URL must be set}"
: "${MINIO_SOURCE_ACCESS_KEY:?MINIO_SOURCE_ACCESS_KEY must be set}"
: "${MINIO_SOURCE_SECRET_KEY:?MINIO_SOURCE_SECRET_KEY must be set}"

command -v "$MC_BIN" >/dev/null 2>&1 || {
  printf 'ERROR: mc not found: %s\n' "$MC_BIN" >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  printf 'ERROR: jq is required\n' >&2
  exit 1
}

runtime_dir="$(mktemp -d /run/shopsphere-mc-versioning.XXXXXX)"
trap 'rm -rf -- "$runtime_dir"' EXIT
export MC_CONFIG_DIR="$runtime_dir/mc-config"
mkdir -p "$MC_CONFIG_DIR"
chmod 700 "$MC_CONFIG_DIR"

mc=("$MC_BIN")
if [[ "$MINIO_INSECURE" == "true" ]]; then
  mc+=("--insecure")
fi

"${mc[@]}" alias set "$MINIO_SOURCE_ALIAS" "${MINIO_SOURCE_URL%/}" \
  "$MINIO_SOURCE_ACCESS_KEY" "$MINIO_SOURCE_SECRET_KEY" --api S3v4 >/dev/null

read -r -a buckets <<< "$MINIO_BUCKETS"
for bucket in "${buckets[@]}"; do
  printf 'Ensuring bucket exists: %s\n' "$bucket"
  "${mc[@]}" mb --ignore-existing "$MINIO_SOURCE_ALIAS/$bucket" >/dev/null

  printf 'Enabling versioning: %s\n' "$bucket"
  "${mc[@]}" version enable "$MINIO_SOURCE_ALIAS/$bucket" >/dev/null

  if ! "${mc[@]}" version info "$MINIO_SOURCE_ALIAS/$bucket" --json |
    jq -e '.versioning.status == "Enabled"' >/dev/null; then
    printf 'ERROR: versioning verification failed for bucket %s\n' "$bucket" >&2
    exit 1
  fi
done

printf 'Versioning is enabled on all configured ShopSphere buckets.\n'
