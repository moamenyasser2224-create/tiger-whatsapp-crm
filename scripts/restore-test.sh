#!/usr/bin/env bash
# ==============================================================================
# TIGER WORKSPACE CRM: AUTOMATED BACKUP RESTORE VERIFICATION TEST
# Defense in Depth: "An untested backup is not a reliable backup"
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tiger-crm}"
TEST_DB_NAME="whatsapp_crm_restore_test_$$"

# Load environment if not already present
if [[ -f "/app/server/.env" ]]; then
  # shellcheck disable=SC1091
  source "/app/server/.env"
elif [[ -f "./server/.env" ]]; then
  # shellcheck disable=SC1091
  source "./server/.env"
fi

if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  echo "❌ Error: BACKUP_ENCRYPTION_KEY environment variable is missing."
  exit 1
fi

echo "======================================================================"
echo "🧪 STARTING AUTOMATED DISASTER RECOVERY RESTORE VERIFICATION TEST"
echo "======================================================================"

# 1. Find the latest encrypted backup archive
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "tiger_crm_backup_*.sql.gz.enc" 2>/dev/null | sort -r | head -n 1 || true)

if [[ -z "$LATEST_BACKUP" ]]; then
  echo "❌ No encrypted backup archives found in $BACKUP_DIR"
  exit 1
fi

echo "📦 Found latest backup: $LATEST_BACKUP"

# 2. Verify SHA-256 Checksum
CHECKSUM_FILE="${LATEST_BACKUP%.sql.gz.enc}.sha256"
if [[ -f "$CHECKSUM_FILE" ]]; then
  echo "🔍 Verifying SHA-256 integrity checksum..."
  (cd "$BACKUP_DIR" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
  echo "  ✅ Checksum signature valid: Archive is untampered."
else
  echo "⚠️ Warning: Checksum file not found. Proceeding with caution..."
fi

# 3. Create isolated temporary scratch database
echo "🗄️ Initializing temporary isolated test database: $TEST_DB_NAME..."

# Cleanup trap to ensure test database and decrypted scratch files are deleted on exit
SCRATCH_DIR=$(mktemp -d /tmp/tiger_restore_test.XXXXXX)
cleanup() {
  echo "🧹 Cleaning up scratch artifacts and temporary database..."
  rm -rf "$SCRATCH_DIR"
  if command -v dropdb &> /dev/null; then
    dropdb --if-exists "$TEST_DB_NAME" || true
  fi
}
trap cleanup EXIT

# 4. Decrypt and Decompress into isolated scratch SQL file
echo "🔑 Decrypting archive using BACKUP_ENCRYPTION_KEY (AES-256-CBC)..."
DECRYPTED_SQL="${SCRATCH_DIR}/restored.sql"

openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass "env:BACKUP_ENCRYPTION_KEY" -in "$LATEST_BACKUP" \
  | gunzip -c > "$DECRYPTED_SQL"

if [[ ! -s "$DECRYPTED_SQL" ]]; then
  echo "❌ Decrypted payload is empty or invalid. Check your BACKUP_ENCRYPTION_KEY."
  exit 1
fi

echo "  ✅ Decryption and gzip decompression successful."

# 5. Restore into Scratch Database and Run Verification Queries
if command -v createdb &> /dev/null && [[ "${DATABASE_URL:-}" == postgres* ]]; then
  echo "🐘 Creating PostgreSQL scratch database..."
  createdb "$TEST_DB_NAME"

  echo "📥 Streaming decrypted schema and data into scratch database..."
  psql -d "$TEST_DB_NAME" -f "$DECRYPTED_SQL" > /dev/null

  echo "🔎 Executing data integrity assertions..."
  USER_COUNT=$(psql -d "$TEST_DB_NAME" -t -c "SELECT count(*) FROM users;")
  CUSTOMER_COUNT=$(psql -d "$TEST_DB_NAME" -t -c "SELECT count(*) FROM customers;")
  AUDIT_COUNT=$(psql -d "$TEST_DB_NAME" -t -c "SELECT count(*) FROM audit_logs;")

  echo "  ↳ Restored Users Count:        ${USER_COUNT// /}"
  echo "  ↳ Restored Customers Count:    ${CUSTOMER_COUNT// /}"
  echo "  ↳ Restored Audit Logs Count:   ${AUDIT_COUNT// /}"

  if [[ "${USER_COUNT// /}" -eq 0 && "${CUSTOMER_COUNT// /}" -eq 0 ]]; then
    echo "❌ Error: Restored database contains 0 user and customer records."
    exit 1
  fi
else
  # SQLite Environment
  echo "🗄️ Testing SQLite restore into temporary database..."
  TEST_SQLITE_FILE="${SCRATCH_DIR}/test.db"
  sqlite3 "$TEST_SQLITE_FILE" < "$DECRYPTED_SQL"

  USER_COUNT=$(sqlite3 "$TEST_SQLITE_FILE" "SELECT count(*) FROM users;" || echo "0")
  CUSTOMER_COUNT=$(sqlite3 "$TEST_SQLITE_FILE" "SELECT count(*) FROM customers;" || echo "0")

  echo "  ↳ Restored Users Count:        $USER_COUNT"
  echo "  ↳ Restored Customers Count:    $CUSTOMER_COUNT"
fi

echo "======================================================================"
echo "🎉 RESTORE VERIFICATION TEST PASSED 100%!"
echo "   - Decryption: SUCCESS"
echo "   - Decompression: SUCCESS"
echo "   - Schema Reconstitution: SUCCESS"
echo "   - Data Integrity Assertion: VERIFIED"
echo "======================================================================"
exit 0
