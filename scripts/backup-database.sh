#!/usr/bin/env bash
# ==============================================================================
# TIGER WORKSPACE CRM: ENCRYPTED DATABASE BACKUP SCRIPT
# Defense in Depth: AES-256-CBC with PBKDF2, Checksumming, Offsite Replication
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/tiger-crm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="tiger_crm_backup_${TIMESTAMP}.sql.gz.enc"
CHECKSUM_FILENAME="tiger_crm_backup_${TIMESTAMP}.sha256"
TARGET_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Load environment if not already present
if [[ -f "/app/server/.env" ]]; then
  # shellcheck disable=SC1091
  source "/app/server/.env"
elif [[ -f "./server/.env" ]]; then
  # shellcheck disable=SC1091
  source "./server/.env"
fi

# Ensure separate dedicated backup encryption key exists
if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  echo "❌ Error: BACKUP_ENCRYPTION_KEY environment variable is not set."
  echo "   Generate one via: openssl rand -hex 32"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "⏳ Starting database backup: $TIMESTAMP..."

# 1. Dump database and encrypt directly in a streaming pipeline (No plaintext on disk)
if command -v pg_dump &> /dev/null && [[ "${DATABASE_URL:-}" == postgres* ]]; then
  echo "🐘 Running pg_dump against PostgreSQL database..."
  pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists \
    | gzip -9 \
    | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass "env:BACKUP_ENCRYPTION_KEY" -out "$TARGET_FILE"
else
  # Fallback for SQLite development environment
  echo "🗄️ Dumping local SQLite database..."
  DB_PATH="${DATABASE_URL#file:}"
  if [[ -f "$DB_PATH" ]]; then
    sqlite3 "$DB_PATH" ".dump" \
      | gzip -9 \
      | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass "env:BACKUP_ENCRYPTION_KEY" -out "$TARGET_FILE"
  else
    echo "❌ Database file not found at: $DB_PATH"
    exit 1
  fi
fi

# 2. Generate SHA-256 Checksum for tamper detection
cd "$BACKUP_DIR"
sha256sum "$BACKUP_FILENAME" > "$CHECKSUM_FILENAME"

BACKUP_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
echo "✅ Encrypted backup created successfully: $TARGET_FILE (Size: $BACKUP_SIZE)"

# 3. Offsite Replication to Secondary Cloud Storage (S3 / Cloudflare R2 / Offsite Host)
# Note: Ensure AWS CLI or rclone credentials point to an ISOLATED secondary cloud account
if [[ -n "${OFFSITE_BACKUP_S3_BUCKET:-}" ]]; then
  echo "☁️ Replicating encrypted backup to offsite bucket: ${OFFSITE_BACKUP_S3_BUCKET}..."
  aws s3 cp "$TARGET_FILE" "s3://${OFFSITE_BACKUP_S3_BUCKET}/backups/${BACKUP_FILENAME}" --sse aws:kms
  aws s3 cp "${BACKUP_DIR}/${CHECKSUM_FILENAME}" "s3://${OFFSITE_BACKUP_S3_BUCKET}/backups/${CHECKSUM_FILENAME}"
  echo "✅ Offsite replication verified."
else
  echo "ℹ️  OFFSITE_BACKUP_S3_BUCKET not configured. Retaining locally under $BACKUP_DIR."
fi

# 4. Enforce 30-Day Retention Policy (Purge local archives older than 30 days)
find "$BACKUP_DIR" -name "tiger_crm_backup_*.sql.gz.enc" -mtime +30 -delete
find "$BACKUP_DIR" -name "tiger_crm_backup_*.sha256" -mtime +30 -delete

echo "🎉 Backup workflow completed successfully at $(date)."
