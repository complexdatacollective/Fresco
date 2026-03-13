#!/bin/bash
# Start the development PostgreSQL container.
# Container and volume names are scoped to the current git branch for isolation.

set -e

IMAGE="postgres:16-alpine"
PORT=5432

# Derive a safe suffix from the current git branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "default")
SAFE_BRANCH=$(echo "$BRANCH" | tr '[:upper:]/' '[:lower:]-' | sed 's/[^a-z0-9-]//g')
CONTAINER_NAME="fresco-dev-postgres-${SAFE_BRANCH}"
VOLUME_NAME="fresco-dev-db-${SAFE_BRANCH}"

# Reuse existing running container
if docker container inspect "$CONTAINER_NAME" &>/dev/null; then
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME")" = "true" ]; then
    echo "PostgreSQL already running ($CONTAINER_NAME) on port $PORT"
    docker logs -f "$CONTAINER_NAME"
    exit 0
  fi
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

# Create volume if it doesn't exist
docker volume inspect "$VOLUME_NAME" &>/dev/null 2>&1 || docker volume create "$VOLUME_NAME" >/dev/null

echo "Starting PostgreSQL on port $PORT [branch: $BRANCH]..."

exec docker run --rm \
  --name "$CONTAINER_NAME" \
  -p "$PORT:5432" \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -v "$VOLUME_NAME:/var/lib/postgresql/data" \
  "$IMAGE"
