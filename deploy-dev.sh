#!/usr/bin/env bash
# Build, push, and deploy to dev VM.
#
# Usage (from project root):
#   ./deploy-dev.sh                          # build + push only
#   ./deploy-dev.sh --pull <vm-ip>           # SSH into VM and pull + restart
#   ./deploy-dev.sh --full <vm-ip>           # build + push + pull + restart
#
# Env vars (or set in .env):
#   DOCKER_HUB_USERNAME   Docker Hub user (default: tanish0510)
#   VITE_BACKEND_URL      Backend URL baked into frontend (default: https://dev.lynkr.club)
#   VM_USER               SSH user on the VM (default: your current user)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

source .env 2>/dev/null || true

DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-tanish0510}"
# Don't inherit VITE_BACKEND_URL from local .env — production frontend
# should use window.location.origin (set by passing empty string).
BACKEND_URL=""
PLATFORM="${PLATFORM:-linux/amd64}"
VM_USER="${VM_USER:-$(whoami)}"

BACKEND_TAG="${DOCKER_HUB_USERNAME}/lynkr-backend:dev"
FRONTEND_TAG="${DOCKER_HUB_USERNAME}/lynkr-frontend:dev"

ACTION="${1:-build}"
VM_IP="${2:-}"

build_and_push() {
  echo "==> Building backend: $BACKEND_TAG"
  docker buildx build \
    --provenance=false --sbom=false \
    --platform "$PLATFORM" \
    -t "$BACKEND_TAG" \
    -f backend/Dockerfile backend \
    --push

  echo "==> Building frontend: $FRONTEND_TAG (VITE_BACKEND_URL=$BACKEND_URL)"
  docker buildx build \
    --provenance=false --sbom=false \
    --platform "$PLATFORM" \
    -t "$FRONTEND_TAG" \
    --build-arg VITE_BACKEND_URL="$BACKEND_URL" \
    --build-arg REACT_APP_BACKEND_URL="$BACKEND_URL" \
    -f frontend/Dockerfile.prod frontend \
    --push

  echo "==> Pushed: $BACKEND_TAG  $FRONTEND_TAG"
}

pull_and_restart() {
  if [ -z "$VM_IP" ]; then
    echo "Error: VM IP required.  Usage: ./deploy-dev.sh --pull <vm-ip>"
    exit 1
  fi
  echo "==> Pulling and restarting on $VM_USER@$VM_IP"
  ssh "$VM_USER@$VM_IP" 'cd ~/lynkr && docker compose -f docker-compose.dev.yml pull && docker compose -f docker-compose.dev.yml up -d && docker image prune -f'
}

case "$ACTION" in
  --pull)  pull_and_restart ;;
  --full)  build_and_push && pull_and_restart ;;
  *)       build_and_push ;;
esac

echo "==> Done."
