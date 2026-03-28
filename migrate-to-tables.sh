#!/bin/bash
# Migrate data from the old doc_store JSONB table into the new typed ORM tables.
#
# Usage:
#   ./migrate-to-tables.sh
#
# Prereqs: Postgres must be running and DATABASE_URL must be set (via .env or env).

set -e
cd "$(dirname "$0")"

[ -f .env ] && set -a && source .env && set +a

BACKEND_DIR="backend"
VENV_DIR="$BACKEND_DIR/.venv"
PY_BIN="$VENV_DIR/bin/python"

if [ ! -f "$PY_BIN" ]; then
  echo "[!] Python venv not found at $VENV_DIR"
  echo "    Run ./run-local.sh first to create the venv and install dependencies."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  PG_PORT="${POSTGRES_PUBLISH_PORT:-5432}"
  DATABASE_URL="postgresql+asyncpg://lynkr:lynkr@127.0.0.1:${PG_PORT}/lynkr_db"
  echo "[i] DATABASE_URL not set — using default: $DATABASE_URL"
fi

export DATABASE_URL
export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"

echo ""
echo "=== Lynkr: doc_store → ORM tables migration ==="
echo ""
echo "  Database: ${DATABASE_URL%%@*}@***"
echo ""

"$PY_BIN" "$BACKEND_DIR/scripts/migrate_to_tables.py"

echo ""
echo "Migration complete. You can now start the backend with ./run-local.sh"
