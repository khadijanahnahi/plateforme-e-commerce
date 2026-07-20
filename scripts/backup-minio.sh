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
  printf 'ERROR: %s must not be readable by group or others (use chmod 600)\n' "$BACKUP_ENV_FILE" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$BACKUP_ENV_FILE"

MC_BIN="${MC_BIN:-/usr/local/bin/mc}"
MINIO_SOURCE_ALIAS="${MINIO_SOURCE_ALIAS:-shopsphere-source}"
MINIO_REMOTE_ALIAS="${MINIO_REMOTE_ALIAS:-shopsphere-offsite}"
MINIO_REMOTE_PREFIX="${MINIO_REMOTE_PREFIX:-minio}"
MINIO_BUCKETS="${MINIO_BUCKETS:-products categories banners invoices}"
MINIO_LOCAL_BACKUP_DIR="${MINIO_LOCAL_BACKUP_DIR:-/opt/shopsphere/backups/minio}"
MINIO_LOCAL_RETENTION_DAYS="${MINIO_LOCAL_RETENTION_DAYS:-14}"
MINIO_REMOTE_RETENTION_DAYS="${MINIO_REMOTE_RETENTION_DAYS:-90}"
MINIO_MIN_FREE_MB="${MINIO_MIN_FREE_MB:-512}"
MINIO_INSECURE="${MINIO_INSECURE:-false}"
BACKUP_LOG_DIR="${BACKUP_LOG_DIR:-/var/log/shopsphere-backups}"
BACKUP_STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/shopsphere-backups}"
BACKUP_LOCK_DIR="${BACKUP_LOCK_DIR:-/run/lock/shopsphere-backups}"
BACKUP_MONITORING_URL="${BACKUP_MONITORING_URL:-}"

: "${MINIO_SOURCE_URL:?MINIO_SOURCE_URL must be set}"
: "${MINIO_SOURCE_ACCESS_KEY:?MINIO_SOURCE_ACCESS_KEY must be set}"
: "${MINIO_SOURCE_SECRET_KEY:?MINIO_SOURCE_SECRET_KEY must be set}"
: "${MINIO_REMOTE_URL:?MINIO_REMOTE_URL must be set}"
: "${MINIO_REMOTE_ACCESS_KEY:?MINIO_REMOTE_ACCESS_KEY must be set}"
: "${MINIO_REMOTE_SECRET_KEY:?MINIO_REMOTE_SECRET_KEY must be set}"
: "${MINIO_REMOTE_BUCKET:?MINIO_REMOTE_BUCKET must be set}"

for numeric_value in \
  "$MINIO_LOCAL_RETENTION_DAYS" \
  "$MINIO_REMOTE_RETENTION_DAYS" \
  "$MINIO_MIN_FREE_MB"; do
  [[ "$numeric_value" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: MinIO retention and disk values must be non-negative integers\n' >&2
    exit 1
  }
done
[[ "$MINIO_LOCAL_BACKUP_DIR" == /* && "$MINIO_LOCAL_BACKUP_DIR" != "/" ]] || {
  printf 'ERROR: MINIO_LOCAL_BACKUP_DIR must be a safe absolute path\n' >&2
  exit 1
}
[[ "$MINIO_REMOTE_PREFIX" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] &&
  [[ "$MINIO_REMOTE_PREFIX" != *".."* ]] || {
  printf 'ERROR: MINIO_REMOTE_PREFIX is unsafe\n' >&2
  exit 1
}
[[ "$MINIO_REMOTE_BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] || {
  printf 'ERROR: MINIO_REMOTE_BUCKET is not a valid bucket name\n' >&2
  exit 1
}

for command_name in "$MC_BIN" jq sha256sum flock df stat find date tee; do
  command -v "$command_name" >/dev/null 2>&1 || {
    printf 'ERROR: required command not found: %s\n' "$command_name" >&2
    exit 1
  }
done

source_url="${MINIO_SOURCE_URL%/}"
remote_url="${MINIO_REMOTE_URL%/}"
if [[ "$source_url" == "$remote_url" ]]; then
  printf 'ERROR: MinIO remote endpoint must be outside the source VPS\n' >&2
  exit 1
fi
if [[ "$remote_url" =~ ^https?://(localhost|127\.0\.0\.1)(:|/|$) ]]; then
  printf 'ERROR: MinIO remote endpoint points to the local VPS\n' >&2
  exit 1
fi

mkdir -p "$MINIO_LOCAL_BACKUP_DIR" "$BACKUP_LOG_DIR" "$BACKUP_STATE_DIR" "$BACKUP_LOCK_DIR"
chmod 700 "$MINIO_LOCAL_BACKUP_DIR" "$BACKUP_STATE_DIR" "$BACKUP_LOCK_DIR"
touch "$BACKUP_LOG_DIR/minio.log"
chmod 600 "$BACKUP_LOG_DIR/minio.log"
exec > >(tee -a "$BACKUP_LOG_DIR/minio.log") 2>&1

log() {
  printf '%s [%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1" "$2"
}

notify_monitor() {
  local status="$1"
  [[ -n "$BACKUP_MONITORING_URL" ]] || return 0
  command -v curl >/dev/null 2>&1 || return 0
  curl --fail --silent --show-error --max-time 10 --retry 2 \
    -X POST -H 'Content-Type: application/json' \
    --data "{\"service\":\"minio-backup\",\"status\":\"${status}\"}" \
    "$BACKUP_MONITORING_URL" >/dev/null || log WARN "Monitoring notification failed"
}

runtime_dir="$(mktemp -d /run/shopsphere-mc.XXXXXX)"
snapshot_dir=""
cleanup() {
  local exit_code=$?
  trap - EXIT ERR
  rm -rf -- "$runtime_dir"
  if (( exit_code != 0 )); then
    [[ -z "$snapshot_dir" ]] || rm -rf -- "$snapshot_dir"
    log ERROR "MinIO backup failed (exit ${exit_code})"
    notify_monitor failure
  fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'log ERROR "MinIO backup command failed at line ${LINENO}"' ERR

exec 9>"$BACKUP_LOCK_DIR/minio.lock"
if ! flock -n 9; then
  log ERROR "Another MinIO backup is already running"
  exit 1
fi

export MC_CONFIG_DIR="$runtime_dir/mc-config"
mkdir -p "$MC_CONFIG_DIR"
chmod 700 "$MC_CONFIG_DIR"

mc=("$MC_BIN")
if [[ "$MINIO_INSECURE" == "true" ]]; then
  mc+=("--insecure")
fi

# Credentials are loaded from the root-only file. Shell tracing is never enabled,
# and the temporary mc configuration is destroyed on exit.
"${mc[@]}" alias set "$MINIO_SOURCE_ALIAS" "$source_url" \
  "$MINIO_SOURCE_ACCESS_KEY" "$MINIO_SOURCE_SECRET_KEY" --api S3v4 >/dev/null
"${mc[@]}" alias set "$MINIO_REMOTE_ALIAS" "$remote_url" \
  "$MINIO_REMOTE_ACCESS_KEY" "$MINIO_REMOTE_SECRET_KEY" --api S3v4 >/dev/null

"${mc[@]}" admin info "$MINIO_SOURCE_ALIAS" >/dev/null
"${mc[@]}" mb --ignore-existing "$MINIO_REMOTE_ALIAS/$MINIO_REMOTE_BUCKET" >/dev/null

available_kb="$(df -Pk "$MINIO_LOCAL_BACKUP_DIR" | awk 'NR == 2 {print $4}')"
[[ "$available_kb" =~ ^[0-9]+$ ]] || {
  log ERROR "Could not determine available local disk space"
  exit 1
}
if (( available_kb * 1024 < MINIO_MIN_FREE_MB * 1024 * 1024 )); then
  log ERROR "Insufficient local disk space for MinIO metadata exports"
  exit 1
fi

timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
snapshot_dir="$MINIO_LOCAL_BACKUP_DIR/$timestamp"
metadata_dir="$snapshot_dir/metadata"
mkdir -p "$metadata_dir"
remote_base="$MINIO_REMOTE_ALIAS/$MINIO_REMOTE_BUCKET/$MINIO_REMOTE_PREFIX"
remote_snapshot="$remote_base/$timestamp"

read -r -a buckets <<< "$MINIO_BUCKETS"
if ((${#buckets[@]} == 0)); then
  log ERROR "MINIO_BUCKETS is empty"
  exit 1
fi

declare -A source_counts
log INFO "Starting off-VPS MinIO snapshot '${timestamp}'"
for bucket in "${buckets[@]}"; do
  [[ "$bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] || {
    log ERROR "Invalid bucket name in MINIO_BUCKETS: ${bucket}"
    exit 1
  }

  "${mc[@]}" stat "$MINIO_SOURCE_ALIAS/$bucket" >/dev/null || {
    log ERROR "Configured source bucket does not exist: ${bucket}"
    exit 1
  }

  source_count="$("${mc[@]}" ls --recursive --json "$MINIO_SOURCE_ALIAS/$bucket" | jq -s 'length')"
  source_counts["$bucket"]="$source_count"
  log INFO "Copying bucket '${bucket}' (${source_count} current objects)"

  # Every run writes to a new timestamped prefix. --remove is intentionally not
  # used, so an earlier snapshot can never be pruned by mirroring a newer one.
  "${mc[@]}" mirror --retry --preserve \
    "$MINIO_SOURCE_ALIAS/$bucket" \
    "$remote_snapshot/buckets/$bucket"

  remote_count="$("${mc[@]}" ls --recursive --json \
    "$remote_snapshot/buckets/$bucket" | jq -s 'length')"
  if [[ "$remote_count" != "$source_count" ]]; then
    log ERROR "Object count mismatch for '${bucket}': source=${source_count}, remote=${remote_count}"
    exit 1
  fi
done

log INFO "Exporting MinIO configuration, bucket metadata and IAM"
"${mc[@]}" admin config export "$MINIO_SOURCE_ALIAS" > "$metadata_dir/minio-config.txt"
[[ -s "$metadata_dir/minio-config.txt" ]] || {
  log ERROR "MinIO configuration export is empty"
  exit 1
}

(
  cd "$metadata_dir"
  "${mc[@]}" admin cluster bucket export "$MINIO_SOURCE_ALIAS"
)
bucket_metadata_file="$(find "$metadata_dir" -maxdepth 1 -type f -name '*.zip' -print -quit)"
[[ -n "$bucket_metadata_file" && -s "$bucket_metadata_file" ]] || {
  log ERROR "MinIO bucket metadata export is missing"
  exit 1
}
if [[ "$bucket_metadata_file" != "$metadata_dir/minio-bucket-metadata.zip" ]]; then
  mv -- "$bucket_metadata_file" "$metadata_dir/minio-bucket-metadata.zip"
fi

"${mc[@]}" admin cluster iam export "$MINIO_SOURCE_ALIAS" \
  --output "$metadata_dir/minio-iam.zip"
[[ -s "$metadata_dir/minio-iam.zip" ]] || {
  log ERROR "MinIO IAM export is missing"
  exit 1
}

{
  printf 'snapshot=%s\n' "$timestamp"
  for bucket in "${buckets[@]}"; do
    printf 'bucket.%s.current_objects=%s\n' "$bucket" "${source_counts[$bucket]}"
  done
} > "$snapshot_dir/manifest.txt"

checksum_tmp="$(mktemp "$runtime_dir/minio-checksums.XXXXXX")"
(
  cd "$snapshot_dir"
  find . -type f -print0 |
    sort -z |
    xargs -0 sha256sum > "$checksum_tmp"
)
mv -- "$checksum_tmp" "$snapshot_dir/SHA256SUMS"
[[ -s "$snapshot_dir/SHA256SUMS" ]] || {
  log ERROR "MinIO checksum manifest is empty"
  exit 1
}

"${mc[@]}" mirror --retry "$snapshot_dir" "$remote_snapshot/control"
local_control_count="$(find "$snapshot_dir" -type f | wc -l)"
remote_control_count="$("${mc[@]}" ls --recursive --json "$remote_snapshot/control" | jq -s 'length')"
if [[ "$remote_control_count" != "$local_control_count" ]]; then
  log ERROR "MinIO control export count mismatch: local=${local_control_count}, remote=${remote_control_count}"
  exit 1
fi

printf '{"snapshot":"%s","status":"complete"}\n' "$timestamp" > "$snapshot_dir/_SUCCESS.json"
"${mc[@]}" cp "$snapshot_dir/_SUCCESS.json" "$remote_snapshot/_SUCCESS.json" >/dev/null
"${mc[@]}" stat "$remote_snapshot/_SUCCESS.json" >/dev/null

while IFS= read -r -d '' expired_snapshot; do
  log INFO "Removing expired local MinIO metadata snapshot: $(basename "$expired_snapshot")"
  rm -rf -- "$expired_snapshot"
done < <(
  find "$MINIO_LOCAL_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d \
    -name '????????T??????Z' -mtime "+${MINIO_LOCAL_RETENTION_DAYS}" -print0
)

if (( MINIO_REMOTE_RETENTION_DAYS > 0 )); then
  cutoff="$(date -u -d "-${MINIO_REMOTE_RETENTION_DAYS} days" +'%Y%m%dT%H%M%SZ')"
  while IFS= read -r remote_key; do
    snapshot_name="${remote_key%/}"
    snapshot_name="${snapshot_name##*/}"
    if [[ "$snapshot_name" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] && [[ "$snapshot_name" < "$cutoff" ]]; then
      log INFO "Removing expired off-VPS MinIO snapshot: ${snapshot_name}"
      "${mc[@]}" rm --recursive --force "$remote_base/$snapshot_name" >/dev/null
    fi
  done < <(
    "${mc[@]}" ls --json "$remote_base/" |
      jq -r 'select(.type == "folder") | .key'
  )
fi

success_epoch="$(date -u +'%s')"
printf '%s\n' "$timestamp" > "$BACKUP_STATE_DIR/minio.last_success"
cat > "$BACKUP_STATE_DIR/minio.prom" <<EOF
# HELP shopsphere_backup_last_success_timestamp_seconds Unix timestamp of the last successful backup.
# TYPE shopsphere_backup_last_success_timestamp_seconds gauge
shopsphere_backup_last_success_timestamp_seconds{job="minio"} ${success_epoch}
EOF
chmod 600 "$BACKUP_STATE_DIR/minio.last_success" "$BACKUP_STATE_DIR/minio.prom"

log INFO "MinIO off-VPS snapshot completed: ${remote_snapshot}"
snapshot_dir=""
notify_monitor success
