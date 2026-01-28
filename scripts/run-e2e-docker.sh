#!/bin/bash
# Run Playwright e2e tests inside a Linux Docker container
#
# This runs the exact same tests as `pnpm test:e2e:local` but inside the
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

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
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

docker run --rm \
  -e CI=true \
  -v "$(pwd)":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /work/node_modules \
  -v /work/.next \
  -w /work \
  --add-host=host.docker.internal:host-gateway \
  "${IMAGE}" \
  sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && $PLAYWRIGHT_CMD"

echo ""
echo "✅ Tests completed."
