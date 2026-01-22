#!/bin/bash

# Script to build and push Docker images to Docker Hub
# Usage: ./build-and-push.sh <docker-hub-username>

set -e

DOCKER_HUB_USERNAME=${1:-"tanish0510"}

if [ "$DOCKER_HUB_USERNAME" == "yourusername" ]; then
    echo "Error: Please provide your Docker Hub username"
    echo "Usage: ./build-and-push.sh <docker-hub-username>"
    exit 1
fi

echo "Building and pushing images to Docker Hub as: $DOCKER_HUB_USERNAME"
echo ""

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Setup buildx for multi-platform builds
echo "Setting up Docker buildx..."
docker buildx create --use --name multiarch-builder 2>/dev/null || docker buildx use multiarch-builder

# Build and push backend (for linux/amd64 platform)
echo ""
echo "Building backend image for linux/amd64..."
cd backend
docker buildx build --platform linux/amd64 -t ${DOCKER_HUB_USERNAME}/lynkr-backend:latest --push .
cd ..

# Build and push frontend (for linux/amd64 platform)
echo ""
echo "Building frontend image for linux/amd64..."
cd frontend

# Get backend URL from environment or use default
REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-https://lynkr.club}

echo "Building with REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}"
docker buildx build --platform linux/amd64 -f Dockerfile.prod --build-arg REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL} -t ${DOCKER_HUB_USERNAME}/lynkr-frontend:latest --push .
cd ..

echo ""
echo "✅ All images built and pushed successfully!"
echo ""
echo "Images pushed:"
echo "  - ${DOCKER_HUB_USERNAME}/lynkr-backend:latest"
echo "  - ${DOCKER_HUB_USERNAME}/lynkr-frontend:latest"
echo ""
echo "To use on your VM, set DOCKER_HUB_USERNAME=${DOCKER_HUB_USERNAME} in your .env file"
echo "Then run: docker-compose -f docker-compose.prod.yml up -d"
