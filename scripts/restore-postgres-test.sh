#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

usage() {
  cat <<'EOF'
Usage:
  restore-postgres-test.sh /path/to/backup.dump [--drop-after]
  restore-postgres-test.sh --latest [--drop-after]

The dump is always restored into a new temporary database. Production is never
overwritten. Without --drop-after, the temporary database is kept for review.
EOF
}

BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-/etc/shopsphere/backup.env}"
dump_file=""
drop_after=false

while (($#)); do
  case "$1" in
    --latest)
      dump_file="LATEST"
      ;;
    --drop-after)
      drop_after=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      printf 'ERROR: unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
    *)
      [[ -z "$dump_file" ]] || {
        printf 'ERROR: provide only one dump file\n' >&2
        exit 2
      }
      dump_file="$1"
      ;;
  esac
  shift
done

[[ -n "$dump_file" ]] || {
  usage >&2
  exit 2
}
[[ -r "$BACKUP_ENV_FILE" ]] || {
  printf 'ERROR: backup environment file is not readable: %s\n' "$BACKUP_ENV_FILE" >&2
  exit 1
}

# shellcheck source=/dev/null
source "$BACKUP_ENV_FILE"

SHOPSPHERE_ROOT="${SHOPSPHERE_ROOT:-/opt/shopsphere/current}"
COMPOSE_FILE="${COMPOSE_FILE:-$SHOPSPHERE_ROOT/docker-compose.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-$SHOPSPHERE_ROOT/.env.production}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_BACKUP_DIR="${POSTGRES_BACKUP_DIR:-/opt/shopsphere/backups/postgres}"
BACKUP_LOG_DIR="${BACKUP_LOG_DIR:-/var/log/shopsphere-backups}"
BACKUP_STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/shopsphere-backups}"
BACKUP_LOCK_DIR="${BACKUP_LOCK_DIR:-/run/lock/shopsphere-backups}"
BACKUP_MONITORING_URL="${BACKUP_MONITORING_URL:-}"

: "${POSTGRES_DB:?POSTGRES_DB must be set in BACKUP_ENV_FILE}"
: "${POSTGRES_USER:?POSTGRES_USER must be set in BACKUP_ENV_FILE}"

for command_name in docker sha256sum flock find sort date tee; do
  command -v "$command_name" >/dev/null 2>&1 || {
    printf 'ERROR: required command not found: %s\n' "$command_name" >&2
    exit 1
  }
done

mkdir -p "$BACKUP_LOG_DIR" "$BACKUP_STATE_DIR" "$BACKUP_LOCK_DIR"
touch "$BACKUP_LOG_DIR/postgres-restore-test.log"
chmod 600 "$BACKUP_LOG_DIR/postgres-restore-test.log"
exec > >(tee -a "$BACKUP_LOG_DIR/postgres-restore-test.log") 2>&1

log() {
  printf '%s [%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1" "$2"
}

notify_monitor() {
  local status="$1"
  [[ -n "$BACKUP_MONITORING_URL" ]] || return 0
  command -v curl >/dev/null 2>&1 || return 0
  curl --fail --silent --show-error --max-time 10 --retry 2 \
    -X POST -H 'Content-Type: application/json' \
    --data "{\"service\":\"postgres-restore-test\",\"status\":\"${status}\"}" \
    "$BACKUP_MONITORING_URL" >/dev/null || log WARN "Monitoring notification failed"
}

if [[ "$dump_file" == "LATEST" ]]; then
  dump_file="$(find "$POSTGRES_BACKUP_DIR" -maxdepth 1 -type f \
    -name 'shopsphere-postgres-*.dump' -print | sort | tail -n 1)"
  [[ -n "$dump_file" ]] || {
    log ERROR "No PostgreSQL dump found in ${POSTGRES_BACKUP_DIR}"
    exit 1
  }
fi

dump_file="$(readlink -f "$dump_file")"
checksum_file="${dump_file}.sha256"
[[ -s "$dump_file" ]] || {
  log ERROR "Dump is missing or empty: ${dump_file}"
  exit 1
}
[[ -s "$checksum_file" ]] || {
  log ERROR "Checksum file is missing: ${checksum_file}"
  exit 1
}

(
  cd "$(dirname "$dump_file")"
  sha256sum --check "$(basename "$checksum_file")"
) >/dev/null

compose=(docker compose --project-directory "$SHOPSPHERE_ROOT" --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE")
temporary_db="shopsphere_restore_$(date -u +'%Y%m%d_%H%M%S')_$$"
database_created=false
completed=false

cleanup() {
  local exit_code=$?
  trap - EXIT ERR

  if [[ "$database_created" == true ]] && {
    [[ "$drop_after" == true ]] || (( exit_code != 0 ));
  }; then
    log INFO "Removing temporary restore database '${temporary_db}'"
    "${compose[@]}" exec -T "$POSTGRES_SERVICE" \
      dropdb --username="$POSTGRES_USER" --if-exists "$temporary_db" >/dev/null 2>&1 || true
  fi

  if (( exit_code != 0 )); then
    log ERROR "PostgreSQL restore test failed (exit ${exit_code})"
    notify_monitor failure
  fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'log ERROR "Restore test command failed at line ${LINENO}"' ERR

exec 9>"$BACKUP_LOCK_DIR/postgres-restore-test.lock"
if ! flock -n 9; then
  log ERROR "Another PostgreSQL restore test is already running"
  exit 1
fi

if [[ "$temporary_db" == "$POSTGRES_DB" ]]; then
  log ERROR "Safety check refused production database name"
  exit 1
fi

log INFO "Validating archive structure: ${dump_file}"
"${compose[@]}" exec -T "$POSTGRES_SERVICE" pg_restore --list < "$dump_file" >/dev/null

log INFO "Creating isolated database '${temporary_db}'"
"${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  createdb --username="$POSTGRES_USER" --template=template0 "$temporary_db"
database_created=true

log INFO "Restoring dump into '${temporary_db}'"
"${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  pg_restore \
  --username="$POSTGRES_USER" \
  --dbname="$temporary_db" \
  --no-owner \
  --no-privileges \
  --exit-on-error < "$dump_file"

tables_present="$("${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  psql --username="$POSTGRES_USER" --dbname="$temporary_db" --tuples-only --no-align \
  --command="SELECT
    to_regclass('public.users') IS NOT NULL,
    to_regclass('public.products') IS NOT NULL,
    to_regclass('public.orders') IS NOT NULL;")"

if [[ "$tables_present" != "t|t|t" ]]; then
  log ERROR "One or more required tables are missing (users/products/orders)"
  exit 1
fi

counts="$("${compose[@]}" exec -T "$POSTGRES_SERVICE" \
  psql --username="$POSTGRES_USER" --dbname="$temporary_db" --tuples-only --no-align \
  --command="SELECT 'users=' || COUNT(*) FROM users
    UNION ALL SELECT 'products=' || COUNT(*) FROM products
    UNION ALL SELECT 'orders=' || COUNT(*) FROM orders;")"

completed=true
success_epoch="$(date -u +'%s')"
printf '%s\n' "$success_epoch" > "$BACKUP_STATE_DIR/postgres-restore-test.last_success"
chmod 600 "$BACKUP_STATE_DIR/postgres-restore-test.last_success"

log INFO "Required tables found; restored row counts:"
printf '%s\n' "$counts"
if [[ "$drop_after" == true ]]; then
  log INFO "Restore validation succeeded; temporary database will be removed"
else
  log INFO "Restore validation succeeded; temporary database kept as '${temporary_db}'"
fi
notify_monitor success

[[ "$completed" == true ]]
