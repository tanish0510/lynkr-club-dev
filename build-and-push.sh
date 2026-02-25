#!/usr/bin/env bash
# Build and push backend + frontend images to Docker Hub.
# Usage:
#   ./build-and-push.sh <docker-hub-username> [backend_url]
# Example:
#   ./build-and-push.sh tanish0510 https://lynkr.club

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOCKER_HUB_USERNAME="${1:-${DOCKER_HUB_USERNAME:-}}"
if [ -z "$DOCKER_HUB_USERNAME" ]; then
  echo "Error: Docker Hub username is required."
  echo "Usage: ./build-and-push.sh <docker-hub-username> [backend_url]"
  exit 1
fi

BACKEND_URL="${2:-${VITE_BACKEND_URL:-https://lynkr.club}}"
PLATFORM="${PLATFORM:-linux/amd64}"

BACKEND_TAG="${DOCKER_HUB_USERNAME}/lynkr-backend:latest"
FRONTEND_TAG="${DOCKER_HUB_USERNAME}/lynkr-frontend:latest"

echo "Docker Hub username: $DOCKER_HUB_USERNAME"
echo "Backend image tag:   $BACKEND_TAG"
echo "Frontend image tag:  $FRONTEND_TAG"
echo "Frontend backend URL: $BACKEND_URL"
echo "Build platform:      $PLATFORM"
echo

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed."
  exit 1
fi

echo "Checking buildx builder..."
if ! docker buildx ls >/dev/null 2>&1; then
  echo "Error: docker buildx is unavailable."
  exit 1
fi

# Ensure a usable buildx builder exists
if ! docker buildx inspect lynkr-builder >/dev/null 2>&1; then
  docker buildx create --name lynkr-builder --use
else
  docker buildx use lynkr-builder
fi
docker buildx inspect --bootstrap >/dev/null

echo "Logging in to Docker Hub..."
docker login
echo

echo "Building and pushing backend..."
docker buildx build \
  --platform "$PLATFORM" \
  -t "$BACKEND_TAG" \
  -f backend/Dockerfile backend \
  --push
echo

echo "Building and pushing frontend..."
docker buildx build \
  --platform "$PLATFORM" \
  -t "$FRONTEND_TAG" \
  --build-arg REACT_APP_BACKEND_URL="$BACKEND_URL" \
  --build-arg VITE_BACKEND_URL="$BACKEND_URL" \
  -f frontend/Dockerfile.prod frontend \
  --push
echo

echo "Done. Images pushed:"
echo "  $BACKEND_TAG"
echo "  $FRONTEND_TAG"
echo