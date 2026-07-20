#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-/etc/shopsphere/backup.env}"

if [[ ! -r "$BACKUP_ENV_FILE" ]]; then
  printf 'ERROR: backup environment file is not readable: %s\n' "$BACKUP_ENV_FILE" >&2
  exit 1
fi

mode="$(stat -c '%a' "$BACKUP_ENV_FILE")"
if (( (8#$mode & 077) != 0 )); then
  printf 'ERROR: %s must not be readable by group or others (use chmod 600)\n' "$BACKUP_ENV_FILE" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$BACKUP_ENV_FILE"

SHOPSPHERE_ROOT="${SHOPSPHERE_ROOT:-/opt/shopsphere/current}"
COMPOSE_FILE="${COMPOSE_FILE:-$SHOPSPHERE_ROOT/docker-compose.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-$SHOPSPHERE_ROOT/.env.production}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_BACKUP_DIR="${POSTGRES_BACKUP_DIR:-/opt/shopsphere/backups/postgres}"
POSTGRES_LOCAL_RETENTION_DAYS="${POSTGRES_LOCAL_RETENTION_DAYS:-14}"
POSTGRES_MIN_FREE_MB="${POSTGRES_MIN_FREE_MB:-2048}"
POSTGRES_REMOTE_ENABLED="${POSTGRES_REMOTE_ENABLED:-true}"
POSTGRES_REMOTE_PREFIX="${POSTGRES_REMOTE_PREFIX:-postgres}"
POSTGRES_REMOTE_RETENTION_DAYS="${POSTGRES_REMOTE_RETENTION_DAYS:-90}"
BACKUP_LOG_DIR="${BACKUP_LOG_DIR:-/var/log/shopsphere-backups}"
BACKUP_STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/shopsphere-backups}"
BACKUP_LOCK_DIR="${BACKUP_LOCK_DIR:-/run/lock/shopsphere-backups}"
BACKUP_MONITORING_URL="${BACKUP_MONITORING_URL:-}"

: "${POSTGRES_DB:?POSTGRES_DB must be set in BACKUP_ENV_FILE}"
: "${POSTGRES_USER:?POSTGRES_USER must be set in BACKUP_ENV_FILE}"

for numeric_value in \
  "$POSTGRES_LOCAL_RETENTION_DAYS" \
  "$POSTGRES_MIN_FREE_MB" \
  "$POSTGRES_REMOTE_RETENTION_DAYS"; do
  [[ "$numeric_value" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: PostgreSQL retention and disk values must be non-negative integers\n' >&2
    exit 1
  }
done
[[ "$POSTGRES_BACKUP_DIR" == /* && "$POSTGRES_BACKUP_DIR" != "/" ]] || {
  printf 'ERROR: POSTGRES_BACKUP_DIR must be a safe absolute path\n' >&2
  exit 1
}
[[ "$POSTGRES_REMOTE_PREFIX" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] &&
  [[ "$POSTGRES_REMOTE_PREFIX" != *".."* ]] || {
  printf 'ERROR: POSTGRES_REMOTE_PREFIX is unsafe\n' >&2
  exit 1
}
[[ "$POSTGRES_REMOTE_ENABLED" == "true" ]] || {
  printf 'ERROR: POSTGRES_REMOTE_ENABLED must remain true in production\n' >&2
  exit 1
}

for command_name in docker sha256sum flock df stat find date awk tee grep; do
  command -v "$command_name" >/dev/null 2>&1 || {
    printf 'ERROR: required command not found: %s\n' "$command_name" >&2
    exit 1
  }
done

[[ -f "$COMPOSE_FILE" ]] || {
  printf 'ERROR: compose file not found: %s\n' "$COMPOSE_FILE" >&2
  exit 1
}
[[ -f "$COMPOSE_ENV_FILE" ]] || {
  printf 'ERROR: compose environment file not found: %s\n' "$COMPOSE_ENV_FILE" >&2
  exit 1
}

mkdir -p "$POSTGRES_BACKUP_DIR" "$BACKUP_LOG_DIR" "$BACKUP_STATE_DIR" "$BACKUP_LOCK_DIR"
chmod 700 "$POSTGRES_BACKUP_DIR" "$BACKUP_STATE_DIR" "$BACKUP_LOCK_DIR"
touch "$BACKUP_LOG_DIR/postgres.log"
chmod 600 "$BACKUP_LOG_DIR/postgres.log"
exec > >(tee -a "$BACKUP_LOG_DIR/postgres.log") 2>&1

log() {
  printf '%s [%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1" "$2"
}

notify_monitor() {
  local status="$1"
  [[ -n "$BACKUP_MONITORING_URL" ]] || return 0
  command -v curl >/dev/null 2>&1 || {
    log WARN "Monitoring URL configured but curl is unavailable"
    return 0
  }

  curl --fail --silent --show-error --max-time 10 --retry 2 \
    -X POST -H 'Content-Type: application/json' \
    --data "{\"service\":\"postgres-backup\",\"status\":\"${status}\"}" \
    "$BACKUP_MONITORING_URL" >/dev/null || {
      log WARN "Monitoring notification failed"
      return 0
    }
}

partial_file=""
runtime_dir=""
cleanup_resources() {
  local exit_code=$?
  trap - EXIT
  [[ -z "$partial_file" ]] || rm -f -- "$partial_file"
  [[ -z "$runtime_dir" ]] || rm -rf -- "$runtime_dir"
  if (( exit_code != 0 )); then
    notify_monitor failure
  fi
  exit "$exit_code"
}

on_error() {
  local exit_code="$1"
  local line_number="$2"
  trap - ERR
  log ERROR "PostgreSQL backup failed at line ${line_number} (exit ${exit_code})"
  exit "$exit_code"
}
trap cleanup_resources EXIT
trap 'on_error "$?" "$LINENO"' ERR

exec 9>"$BACKUP_LOCK_DIR/postgres.lock"
if ! flock -n 9; then
  log ERROR "Another PostgreSQL backup is already running"
  exit 1
fi

compose=(docker compose --project-directory "$SHOPSPHERE_ROOT" --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE")

if ! "${compose[@]}" ps --status running --services | grep -Fxq "$POSTGRES_SERVICE"; then
  log ERROR "Compose service '${POSTGRES_SERVICE}' is not running"
  exit 1
fi

database_bytes="$("${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --tuples-only --no-align \
  --command='SELECT pg_database_size(current_database());')"
[[ "$database_bytes" =~ ^[0-9]+$ ]] || {
  log ERROR "Could not determine PostgreSQL database size"
  exit 1
}

available_kb="$(df -Pk "$POSTGRES_BACKUP_DIR" | awk 'NR == 2 {print $4}')"
[[ "$available_kb" =~ ^[0-9]+$ ]] || {
  log ERROR "Could not determine available disk space"
  exit 1
}

available_bytes=$((available_kb * 1024))
minimum_bytes=$((POSTGRES_MIN_FREE_MB * 1024 * 1024))
required_bytes="$database_bytes"
(( required_bytes < minimum_bytes )) && required_bytes="$minimum_bytes"

if (( available_bytes < required_bytes )); then
  log ERROR "Insufficient disk space: available=${available_bytes} required=${required_bytes} bytes"
  exit 1
fi

timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_name="shopsphere-postgres-${timestamp}.dump"
final_file="$POSTGRES_BACKUP_DIR/$backup_name"
partial_file="${final_file}.partial"
checksum_file="${final_file}.sha256"

log INFO "Starting PostgreSQL custom-format dump for database '${POSTGRES_DB}'"
"${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  pg_dump \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-privileges > "$partial_file"

if [[ ! -s "$partial_file" ]]; then
  log ERROR "PostgreSQL dump is empty"
  exit 1
fi

"${compose[@]}" exec -T "$POSTGRES_SERVICE" pg_restore --list < "$partial_file" >/dev/null
mv -- "$partial_file" "$final_file"
partial_file=""

(
  cd "$POSTGRES_BACKUP_DIR"
  sha256sum "$backup_name" > "${backup_name}.sha256"
)

sha256sum --check "$checksum_file" >/dev/null
backup_size="$(stat -c '%s' "$final_file")"

if [[ "$POSTGRES_REMOTE_ENABLED" == "true" ]]; then
  MC_BIN="${MC_BIN:-/usr/local/bin/mc}"
  MINIO_REMOTE_ALIAS="${MINIO_REMOTE_ALIAS:-shopsphere-offsite}"
  MINIO_INSECURE="${MINIO_INSECURE:-false}"

  : "${MINIO_REMOTE_URL:?MINIO_REMOTE_URL is required for off-VPS PostgreSQL backups}"
  : "${MINIO_REMOTE_ACCESS_KEY:?MINIO_REMOTE_ACCESS_KEY is required}"
  : "${MINIO_REMOTE_SECRET_KEY:?MINIO_REMOTE_SECRET_KEY is required}"
  : "${MINIO_REMOTE_BUCKET:?MINIO_REMOTE_BUCKET is required}"

  command -v "$MC_BIN" >/dev/null 2>&1 || {
    log ERROR "MinIO Client not found: ${MC_BIN}"
    exit 1
  }
  command -v jq >/dev/null 2>&1 || {
    log ERROR "jq is required for remote PostgreSQL retention"
    exit 1
  }

  remote_url="${MINIO_REMOTE_URL%/}"
  if [[ "$remote_url" =~ ^https?://(localhost|127\.0\.0\.1)(:|/|$) ]]; then
    log ERROR "PostgreSQL remote destination points to the local VPS"
    exit 1
  fi

  runtime_dir="$(mktemp -d /run/shopsphere-pg-mc.XXXXXX)"
  export MC_CONFIG_DIR="$runtime_dir/mc-config"
  mkdir -p "$MC_CONFIG_DIR"
  chmod 700 "$MC_CONFIG_DIR"

  mc=("$MC_BIN")
  if [[ "$MINIO_INSECURE" == "true" ]]; then
    mc+=("--insecure")
  fi

  "${mc[@]}" alias set "$MINIO_REMOTE_ALIAS" "$remote_url" \
    "$MINIO_REMOTE_ACCESS_KEY" "$MINIO_REMOTE_SECRET_KEY" --api S3v4 >/dev/null
  "${mc[@]}" mb --ignore-existing "$MINIO_REMOTE_ALIAS/$MINIO_REMOTE_BUCKET" >/dev/null

  remote_base="$MINIO_REMOTE_ALIAS/$MINIO_REMOTE_BUCKET/$POSTGRES_REMOTE_PREFIX"
  remote_snapshot="$remote_base/$timestamp"
  log INFO "Uploading PostgreSQL backup to off-VPS snapshot '${remote_snapshot}'"
  "${mc[@]}" cp "$final_file" "$checksum_file" "$remote_snapshot/" >/dev/null
  "${mc[@]}" stat "$remote_snapshot/$backup_name" >/dev/null
  "${mc[@]}" stat "$remote_snapshot/${backup_name}.sha256" >/dev/null

  if (( POSTGRES_REMOTE_RETENTION_DAYS > 0 )); then
    cutoff="$(date -u -d "-${POSTGRES_REMOTE_RETENTION_DAYS} days" +'%Y%m%dT%H%M%SZ')"
    while IFS= read -r remote_key; do
      snapshot_name="${remote_key%/}"
      snapshot_name="${snapshot_name##*/}"
      if [[ "$snapshot_name" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] && [[ "$snapshot_name" < "$cutoff" ]]; then
        log INFO "Removing expired off-VPS PostgreSQL snapshot: ${snapshot_name}"
        "${mc[@]}" rm --recursive --force "$remote_base/$snapshot_name" >/dev/null
      fi
    done < <(
      "${mc[@]}" ls --json "$remote_base/" |
        jq -r 'select(.type == "folder") | .key'
    )
  fi

  rm -rf -- "$runtime_dir"
  runtime_dir=""
fi

while IFS= read -r -d '' expired_dump; do
  log INFO "Removing expired local PostgreSQL backup: $(basename "$expired_dump")"
  rm -f -- "$expired_dump" "${expired_dump}.sha256"
done < <(
  find "$POSTGRES_BACKUP_DIR" -maxdepth 1 -type f \
    -name 'shopsphere-postgres-*.dump' \
    -mtime "+${POSTGRES_LOCAL_RETENTION_DAYS}" -print0
)

success_epoch="$(date -u +'%s')"
printf '%s\n' "$timestamp" > "$BACKUP_STATE_DIR/postgres.last_success"
cat > "$BACKUP_STATE_DIR/postgres.prom" <<EOF
# HELP shopsphere_backup_last_success_timestamp_seconds Unix timestamp of the last successful backup.
# TYPE shopsphere_backup_last_success_timestamp_seconds gauge
shopsphere_backup_last_success_timestamp_seconds{job="postgres"} ${success_epoch}
# HELP shopsphere_backup_last_size_bytes Size of the last successful backup in bytes.
# TYPE shopsphere_backup_last_size_bytes gauge
shopsphere_backup_last_size_bytes{job="postgres"} ${backup_size}
EOF
chmod 600 "$BACKUP_STATE_DIR/postgres.last_success" "$BACKUP_STATE_DIR/postgres.prom"

log INFO "PostgreSQL backup completed: ${final_file} (${backup_size} bytes)"
notify_monitor success
