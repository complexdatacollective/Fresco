#!/bin/bash
# Start a local S3-compatible storage server for development.
# Uses local-s3 (lightweight S3 mock, ~18MB native image).
# Container and volume names are scoped to the current git branch for isolation.

set -e

IMAGE="luofuxiang/local-s3:native-2.3.1"
PORT=9000
BUCKET="fresco-dev"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "default")
SAFE_BRANCH=$(echo "$BRANCH" | tr '[:upper:]/' '[:lower:]-' | sed 's/[^a-z0-9-]//g')
CONTAINER_NAME="fresco-dev-s3-${SAFE_BRANCH}"
VOLUME_NAME="fresco-dev-s3-${SAFE_BRANCH}"

if docker container inspect "$CONTAINER_NAME" &>/dev/null; then
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME")" = "true" ]; then
    echo "Local S3 already running ($CONTAINER_NAME) on port $PORT"
    docker logs -f "$CONTAINER_NAME"
    exit 0
  fi
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

docker volume inspect "$VOLUME_NAME" &>/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

echo "Starting local S3 on port $PORT [branch: $BRANCH]..."

docker run --rm -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:80" \
  -v "$VOLUME_NAME:/data" \
  "$IMAGE"

# Wait for the server to be ready, then create the bucket
echo "Waiting for local S3 to start..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Create bucket via S3 PUT request (idempotent)
HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT "http://localhost:$PORT/$BUCKET" 2>/dev/null || true)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "409" ]; then
  echo "Local S3 ready — bucket '$BUCKET' available"
else
  echo "Local S3 ready — bucket creation returned $HTTP_STATUS (may already exist)"
fi

echo "  Endpoint: http://localhost:$PORT"
echo "  Bucket:   $BUCKET"
echo "  Region:   us-east-1"
echo "  Credentials: any non-empty string (no auth enforced)"

docker logs -f "$CONTAINER_NAME"
