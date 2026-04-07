#!/bin/bash

# AuditForge Docker Build & Deploy Script
# Usage: ./docker-build.sh [image-name] [tag]

set -e

IMAGE_NAME="${1:-auditforge}"
IMAGE_TAG="${2:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "=========================================="
echo "AuditForge Docker Build"
echo "=========================================="
echo "Image: $FULL_IMAGE_NAME"
echo "Time: $(date)"
echo ""

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Build image
echo "🔨 Building Docker image: $FULL_IMAGE_NAME"
docker build -t "$FULL_IMAGE_NAME" .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Image size: $(docker images --format '{{.Size}}' $FULL_IMAGE_NAME)"
    echo ""
    echo "Next steps:"
    echo ""
    echo "📌 Lightweight mode (app only, external MySQL):"
    echo "   1. cp .env.docker .env"
    echo "   2. Edit .env with your MySQL host/credentials"
    echo "   3. docker-compose -f docker-compose.app.yml up -d"
    echo ""
    echo "📌 Full stack mode (app + MySQL):"
    echo "   1. cp .env.docker .env"
    echo "   2. docker-compose up -d"
    echo ""
    echo "🌐 Access app: http://localhost:3000"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi
