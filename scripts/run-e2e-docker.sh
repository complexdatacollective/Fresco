#!/bin/bash
# Run Playwright e2e tests inside a Linux Docker container
#
# This runs the tests in
# Playwright Docker image for consistent visual snapshots across environments.
#
# Prerequisites:
# - Docker must be running
#
# Usage:
#   ./scripts/run-e2e-docker.sh                    # Run all tests
#   ./scripts/run-e2e-docker.sh --update-snapshots # Update visual snapshots
#   ./scripts/run-e2e-docker.sh --project=dashboard # Run specific project

set -e

PLAYWRIGHT_VERSION="v1.58.0-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"
PNPM_STORE_VOLUME="fresco-e2e-pnpm-store"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Configure pnpm store mount based on environment
# In GitHub Actions, use a host directory that can be cached by actions/cache
# Locally, use a named Docker volume for persistence across runs
if [ "$GITHUB_ACTIONS" = "true" ]; then
  mkdir -p .pnpm-docker-store
  PNPM_STORE_MOUNT="-v $(pwd)/.pnpm-docker-store:/root/.local/share/pnpm/store"
else
  PNPM_STORE_MOUNT="-v ${PNPM_STORE_VOLUME}:/root/.local/share/pnpm/store"
fi

echo "🐳 Running Playwright tests in Docker container..."
echo "   Image: ${IMAGE}"
echo "   Args: ${*:-<none>}"
echo ""

# Build the playwright command
PLAYWRIGHT_CMD="pnpm exec playwright test --config=tests/e2e/playwright.config.ts"
if [ $# -gt 0 ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD $*"
fi

# Exclude .env file from container to prevent local config from affecting tests.
# Required env vars are set explicitly via -e flags for consistency.
docker run --rm \
  -e CI=true \
  -e INSTALLATION_ID=e2e-test-env \
  -v "$(pwd)":/work \
  -v /dev/null:/work/.env:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /work/node_modules \
  -v /work/.next \
  ${PNPM_STORE_MOUNT} \
  -w /work \
  --add-host=host.docker.internal:host-gateway \
  "${IMAGE}" \
  sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && $PLAYWRIGHT_CMD"

echo ""
echo "✅ Tests completed."
