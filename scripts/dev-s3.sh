#!/bin/bash
# Start a local MinIO container for S3-compatible storage in development.
# Container and volume names are scoped to the current git branch for isolation.

set -e

IMAGE="minio/minio:latest"
PORT=9000
CONSOLE_PORT=9001
BUCKET="fresco-dev"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "default")
SAFE_BRANCH=$(echo "$BRANCH" | tr '[:upper:]/' '[:lower:]-' | sed 's/[^a-z0-9-]//g')
CONTAINER_NAME="fresco-dev-s3-${SAFE_BRANCH}"
VOLUME_NAME="fresco-dev-s3-${SAFE_BRANCH}"

if docker container inspect "$CONTAINER_NAME" &>/dev/null; then
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME")" = "true" ]; then
    echo "MinIO already running ($CONTAINER_NAME) on port $PORT"
    docker logs -f "$CONTAINER_NAME"
    exit 0
  fi
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

docker volume inspect "$VOLUME_NAME" &>/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

echo "Starting MinIO on port $PORT [branch: $BRANCH]..."

docker run --rm -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:9000" \
  -p "$CONSOLE_PORT:9001" \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v "$VOLUME_NAME:/data" \
  "$IMAGE" server /data --console-address ":9001"

echo "Waiting for MinIO to start..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" mc alias set local http://localhost:9000 minioadmin minioadmin &>/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$CONTAINER_NAME" mc mb --ignore-existing local/$BUCKET
docker exec "$CONTAINER_NAME" mc anonymous set download local/$BUCKET

echo "MinIO ready — bucket '$BUCKET' created with public-read access"
echo "  Endpoint: http://localhost:$PORT"
echo "  Console:  http://localhost:$CONSOLE_PORT (minioadmin/minioadmin)"
echo "  Bucket:   $BUCKET"
echo "  Region:   us-east-1"
echo "  Access Key ID:     minioadmin"
echo "  Secret Access Key: minioadmin"

docker logs -f "$CONTAINER_NAME"
