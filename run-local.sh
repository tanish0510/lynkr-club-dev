#!/bin/bash
# Run PostgreSQL + pgAdmin (Docker) and the FastAPI backend from source.
# Usage: ./run-local.sh
# Prereq: Docker Desktop, Python 3.11 or 3.12, Node (for frontend in another terminal).
#
# If host ports are busy:
#   POSTGRES_PUBLISH_PORT=5433 PGADMIN_PUBLISH_PORT=5051 ./run-local.sh
# DATABASE_URL is set automatically to match POSTGRES_PUBLISH_PORT unless you set DATABASE_URL in .env.

set -e
cd "$(dirname "$0")"

# Remember CLI/env overrides before .env (sourcing .env must not clobber e.g. PGADMIN_PUBLISH_PORT=5051)
if [ "${POSTGRES_PUBLISH_PORT+set}" = set ]; then
  _CLI_POSTGRES_PUBLISH_PORT="$POSTGRES_PUBLISH_PORT"
fi
if [ "${PGADMIN_PUBLISH_PORT+set}" = set ]; then
  _CLI_PGADMIN_PUBLISH_PORT="$PGADMIN_PUBLISH_PORT"
fi

# Load .env from project root (optional)
[ -f .env ] && set -a && source .env && set +a

if [ "${_CLI_POSTGRES_PUBLISH_PORT+set}" = set ]; then
  POSTGRES_PUBLISH_PORT="$_CLI_POSTGRES_PUBLISH_PORT"
fi
if [ "${_CLI_PGADMIN_PUBLISH_PORT+set}" = set ]; then
  PGADMIN_PUBLISH_PORT="$_CLI_PGADMIN_PUBLISH_PORT"
fi

POSTGRES_USER="${POSTGRES_USER:-lynkr}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-lynkr}"
POSTGRES_DB="${POSTGRES_DB:-lynkr_db}"
# Host ports (change if 5432 / 5050 are already in use on your machine)
POSTGRES_PUBLISH_PORT="${POSTGRES_PUBLISH_PORT:-5432}"
PGADMIN_PUBLISH_PORT="${PGADMIN_PUBLISH_PORT:-5050}"
export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB POSTGRES_PUBLISH_PORT PGADMIN_PUBLISH_PORT

# Async URL for the backend (must match published Postgres port)
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PUBLISH_PORT}/${POSTGRES_DB}"
fi

PORT="${PORT:-8000}"

echo "=============================================="
echo "  Lynkr – run locally"
echo "=============================================="
echo "  PostgreSQL:  127.0.0.1:${POSTGRES_PUBLISH_PORT}  db=${POSTGRES_DB}  user=${POSTGRES_USER}"
echo "  pgAdmin UI:  http://localhost:${PGADMIN_PUBLISH_PORT}"
echo "  Backend:     http://localhost:${PORT}"
echo "  Frontend:    http://localhost:5173 (yarn dev in second terminal)"
echo "=============================================="
echo ""

if command -v lsof >/dev/null 2>&1; then
  if lsof -i ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[!] Port $PORT is already in use (another uvicorn or app)."
    echo "    Free it:  kill \$(lsof -t -i :$PORT)"
    echo "    Or:       PORT=8001 ./run-local.sh"
    echo ""
    exit 1
  fi
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[!] Docker not found. Install Docker Desktop or start Postgres yourself and set DATABASE_URL."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "[!] Neither 'docker compose' nor 'docker-compose' is available."
  exit 1
fi

echo "[1/3] Starting PostgreSQL (${POSTGRES_PUBLISH_PORT}:5432)..."
set +e
$DC up -d postgres
UP_PG=$?
set -e
if [ "$UP_PG" -ne 0 ]; then
  echo ""
  echo "[!] Could not start Postgres container. Common cause: port ${POSTGRES_PUBLISH_PORT} already in use."
  echo "    Check:  lsof -nP -iTCP:${POSTGRES_PUBLISH_PORT} -sTCP:LISTEN"
  echo "    Retry:  POSTGRES_PUBLISH_PORT=5433 ./run-local.sh"
  echo ""
  exit 1
fi

echo "      Waiting for Postgres to accept connections..."
READY=0
for _ in $(seq 1 60); do
  if $DC exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done
if [ "$READY" -ne 1 ]; then
  echo "[!] Postgres did not become ready in time. Logs:"
  $DC logs postgres --tail 40 2>/dev/null || true
  exit 1
fi

# Host TCP check (confirms port publish matches POSTGRES_PUBLISH_PORT)
if command -v nc >/dev/null 2>&1; then
  if nc -z 127.0.0.1 "$POSTGRES_PUBLISH_PORT" 2>/dev/null; then
    echo "      Postgres reachable on 127.0.0.1:${POSTGRES_PUBLISH_PORT}"
  else
    echo "[!] Postgres is healthy in Docker but host port ${POSTGRES_PUBLISH_PORT} is not accepting connections."
    echo "    Recreate:  $DC down && $DC up -d postgres"
    exit 1
  fi
fi

echo ""
echo "[2/3] Starting pgAdmin (host ${PGADMIN_PUBLISH_PORT} -> container 80)..."
set +e
$DC up -d --remove-orphans pgadmin
UP_PGA=$?
set -e
if [ "$UP_PGA" -ne 0 ]; then
  echo "[!] pgAdmin failed to start (often port ${PGADMIN_PUBLISH_PORT} in use)."
  echo "    Check:  lsof -nP -iTCP:${PGADMIN_PUBLISH_PORT} -sTCP:LISTEN"
  echo "    Retry:  PGADMIN_PUBLISH_PORT=5052 ./run-local.sh"
  echo ""
  echo "    Continuing without pgAdmin — backend will still start."
else
  # pgAdmin usually listens within a few seconds after the port opens; cap wait at 45s.
  echo "      Waiting for pgAdmin on 127.0.0.1:${PGADMIN_PUBLISH_PORT} (up to 45s, 1s steps)..."
  PGA_OK=0
  if command -v nc >/dev/null 2>&1; then
    for _ in $(seq 1 45); do
      if nc -z 127.0.0.1 "$PGADMIN_PUBLISH_PORT" 2>/dev/null; then
        PGA_OK=1
        break
      fi
      sleep 1
    done
  fi
  if [ "$PGA_OK" -eq 1 ]; then
    echo "      pgAdmin:  http://127.0.0.1:${PGADMIN_PUBLISH_PORT}/login"
    echo "      (If /login 404s, try http://127.0.0.1:${PGADMIN_PUBLISH_PORT}/browser/ )"
    echo "      Login:    ${PGADMIN_DEFAULT_EMAIL:-admin@example.com} / ${PGADMIN_DEFAULT_PASSWORD:-admin}"
    echo "      Add server in pgAdmin: Host=127.0.0.1 Port=${POSTGRES_PUBLISH_PORT} User=${POSTGRES_USER} Password=*** DB=${POSTGRES_DB}"
  else
    echo "[!] pgAdmin did not open port ${PGADMIN_PUBLISH_PORT} in time."
    echo "    Status:  $DC ps pgadmin"
    $DC ps pgadmin 2>/dev/null || true
    echo "    Recent logs:"
    $DC logs pgadmin --tail 60 2>/dev/null || true
    echo ""
    echo "    If the container maps a different host port, run:  $DC port pgadmin 80"
    echo "    Backend will still start."
  fi
fi

echo ""
echo "[3/3] Backend (venv + uvicorn)..."
cd backend
# Pin interpreter:  LYNKR_PYTHON=python3.12 ./run-local.sh  (avoids mixing e.g. 3.14 vs 3.12 in one .venv)
_VENV_PY="${LYNKR_PYTHON:-python3}"
if [ ! -d .venv ]; then
  "$_VENV_PY" -m venv .venv
fi
PY_BIN="$(pwd)/.venv/bin/python"
if [ ! -x "$PY_BIN" ]; then
  echo "[!] Missing $PY_BIN — recreate venv:  rm -rf .venv && python3 -m venv .venv"
  exit 1
fi
# Frankenstein venv: pyvenv.cfg from one Python while bin/python points at another → packages land in the wrong lib/.
if [ -f .venv/pyvenv.cfg ]; then
  _cfg_ver=$(sed -n 's/^version = *//p' .venv/pyvenv.cfg | head -1 | tr -d ' \r')
  _cfg_mm=$(echo "$_cfg_ver" | cut -d. -f1,2)
  _run_mm=$("$PY_BIN" -c 'import sys; print("%d.%d" % (sys.version_info.major, sys.version_info.minor))')
  if [ -n "$_cfg_ver" ] && [ -n "$_run_mm" ] && [ "$_cfg_mm" != "$_run_mm" ]; then
    echo "[!] .venv metadata says Python ${_cfg_mm} but .venv/bin/python is ${_run_mm}. Recreating venv with ${_VENV_PY}..."
    rm -rf .venv
    "$_VENV_PY" -m venv .venv
    PY_BIN="$(pwd)/.venv/bin/python"
  fi
fi
unset _cfg_ver _cfg_mm _run_mm

echo "      Python:   $($PY_BIN --version 2>&1 | tr -d '\r')"
echo "      Installing Python dependencies (this may take a minute)..."
"$PY_BIN" -m pip install --upgrade pip setuptools wheel -q
if ! "$PY_BIN" -m pip install -r requirements.txt; then
  echo "[!] pip install -r requirements.txt failed."
  echo "    If jq fails to build, install Xcode CLT or use:  brew install jq && pip install jq"
  echo "    Or temporarily comment out jq in requirements.txt for local API-only work."
  exit 1
fi
# Hard requirement for Postgres JSONB layer (ensure present even if requirements was partially synced)
"$PY_BIN" -m pip install -q "SQLAlchemy[asyncio]==2.0.36" "asyncpg==0.30.0"

set +e
"$PY_BIN" <<'PY'
import sys
try:
    import sqlalchemy
    import asyncpg
except Exception as e:
    print("[!] Import check failed:", e, file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
print("      Dependencies OK: SQLAlchemy", sqlalchemy.__version__, "+ asyncpg")
sys.exit(0)
PY
IMPCHK=$?
set -e
if [ "$IMPCHK" -ne 0 ]; then
  echo "      Retrying SQLAlchemy + asyncpg (repair incomplete install)..."
  "$PY_BIN" -m pip install --force-reinstall --no-cache-dir "SQLAlchemy[asyncio]==2.0.36" "asyncpg==0.30.0"
  set +e
  "$PY_BIN" <<'PY'
import sys
try:
    import sqlalchemy
    import asyncpg
except Exception as e:
    print("[!] Import check failed:", e, file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
print("      Dependencies OK: SQLAlchemy", sqlalchemy.__version__, "+ asyncpg")
sys.exit(0)
PY
  IMPCHK=$?
  set -e
fi
if [ "$IMPCHK" -ne 0 ]; then
  echo "[!] Fix the error above, then retry. If this persists:  rm -rf backend/.venv && LYNKR_PYTHON=python3.12 ./run-local.sh"
  exit 1
fi
echo ""
echo "  API:  http://localhost:${PORT}/api/docs"
echo ""
exec .venv/bin/python -m uvicorn server:app --reload --host 0.0.0.0 --port "$PORT"
