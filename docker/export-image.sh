#!/bin/bash

# Build and export AuditForge as a single Docker image archive (.tar)
# Usage: ./export-image.sh [image-name] [tag] [output-file]

set -e

IMAGE_NAME="${1:-auditforge}"
IMAGE_TAG="${2:-latest}"
OUTPUT_FILE="${3:-${IMAGE_NAME}-${IMAGE_TAG}.tar}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

if ! docker info > /dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker first."
  exit 1
fi

echo "Building image: $FULL_IMAGE_NAME"
cd "$PROJECT_ROOT"
docker build -f docker/Dockerfile -t "$FULL_IMAGE_NAME" .

echo "Exporting image archive: $OUTPUT_FILE"
docker save -o "$OUTPUT_FILE" "$FULL_IMAGE_NAME"

echo "Done. Image archive created at: $PROJECT_ROOT/$OUTPUT_FILE"
