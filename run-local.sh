#!/bin/bash
# Run backend + frontend + DB locally from code (no Docker for app).
# Usage: ./run-local.sh
# Prereq: Node.js, Python 3.11 or 3.12 (avoid 3.14 if pip conflicts persist).

set -e
cd "$(dirname "$0")"

# Load .env from project root
[ -f .env ] && set -a && source .env && set +a

export MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"
export DB_NAME="${DB_NAME:-lynkr_db}"

echo "=============================================="
echo "  Lynkr – run locally"
echo "=============================================="
echo "  MONGO_URL: $MONGO_URL"
echo "  Backend:   http://localhost:8000"
echo "  Frontend:  http://localhost:5173 (start in second terminal)"
echo "=============================================="
echo ""

# 1) MongoDB – start if not running
if ! nc -z localhost 27017 2>/dev/null; then
  echo "[1] Starting MongoDB (Docker)..."
  docker run -d --name lynkr-mongo -p 27017:27017 mongo:7.0 2>/dev/null || docker start lynkr-mongo 2>/dev/null || true
  sleep 2
else
  echo "[1] MongoDB already running on 27017"
fi

# 2) Backend – venv + uvicorn
echo ""
echo "[2] Backend (creating venv if needed, then uvicorn)..."
cd backend
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install --upgrade pip >/dev/null
.venv/bin/pip install -r requirements.txt >/dev/null
echo ""
echo "  Starting backend at http://localhost:8000"
echo "  API docs: http://localhost:8000/api/docs"
echo ""
exec .venv/bin/python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
