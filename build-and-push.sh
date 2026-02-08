#!/bin/bash
# Build and push backend + frontend to Docker Hub. Then on GCP VM: pull and run your deploy.sh (or docker compose pull && up).
# Usage: ./build-and-push.sh [docker-hub-username]
# Example: ./build-and-push.sh tanish0510

set -e

USER="${1:-tanish0510}"
BACKEND_TAG="${USER}/lynkr-backend:latest"
FRONTEND_TAG="${USER}/lynkr-frontend:latest"
REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-https://lynkr.club}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Docker Hub user: $USER"
echo "Backend tag: $BACKEND_TAG"
echo "Frontend tag: $FRONTEND_TAG"
echo "REACT_APP_BACKEND_URL: $REACT_APP_BACKEND_URL"
echo ""

echo "Logging in to Docker Hub..."
docker login

echo ""
echo "Building backend..."
docker build -t "$BACKEND_TAG" ./backend

echo ""
echo "Pushing backend..."
docker push "$BACKEND_TAG"

echo ""
echo "Building frontend..."
docker build -f ./frontend/Dockerfile.prod --build-arg REACT_APP_BACKEND_URL="$REACT_APP_BACKEND_URL" -t "$FRONTEND_TAG" ./frontend

echo ""
echo "Pushing frontend..."
docker push "$FRONTEND_TAG"

echo ""
echo "Done. Images on Docker Hub:"
echo "  $BACKEND_TAG"
echo "  $FRONTEND_TAG"
echo ""
echo "On GCP VM (same \$USER in .env as DOCKER_HUB_USERNAME): run your deploy.sh or:"
echo "  docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"
