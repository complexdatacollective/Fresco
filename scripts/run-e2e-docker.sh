#!/bin/bash
# Run Playwright e2e tests inside a Linux Docker container
#
# This ensures consistent visual snapshots across all environments by using
# the same Linux-based Playwright image that CI uses.
#
# Why Docker is required:
# - Visual snapshots depend on font rendering, which differs between OS
# - Running in Docker ensures local tests match CI exactly
# - The Docker socket is mounted so testcontainers can create PostgreSQL containers
#
# Prerequisites:
# - Docker must be running
# - The standalone build should exist (will be created if missing)
#
# Usage:
#   ./scripts/run-e2e-docker.sh                    # Run all tests
#   ./scripts/run-e2e-docker.sh --update-snapshots # Update visual snapshots
#   ./scripts/run-e2e-docker.sh --project=dashboard # Run specific project
#   ./scripts/run-e2e-docker.sh tests/e2e/suites/dashboard/protocols.spec.ts
#
# Environment variables:
#   FORCE_REBUILD=true  - Force rebuild of the Next.js standalone build

set -e

PLAYWRIGHT_VERSION="v1.58.0-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "🐳 Running Playwright tests in Linux container..."
echo "   Image: ${IMAGE}"
echo "   Args: ${*:-<none>}"
echo ""
echo "   This runs tests inside Docker using:"
echo "   - Playwright for browser automation"
echo "   - Testcontainers for PostgreSQL databases"
echo "   - Native Node.js processes for the Next.js app"
echo ""

# Build the playwright command
PLAYWRIGHT_CMD="pnpm exec playwright test --config=tests/e2e/playwright.config.ts"
if [ $# -gt 0 ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD $*"
fi

# Pass through FORCE_REBUILD if set
FORCE_REBUILD_ENV=""
if [ -n "$FORCE_REBUILD" ]; then
  FORCE_REBUILD_ENV="-e FORCE_REBUILD=$FORCE_REBUILD"
fi

docker run --rm \
  -e CI=true \
  $FORCE_REBUILD_ENV \
  -v "$(pwd)":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /work/node_modules \
  -v /work/.next \
  -w /work \
  --network host \
  "${IMAGE}" \
  sh -c "npm i -g pnpm && pnpm install && $PLAYWRIGHT_CMD"

echo ""
echo "✅ Tests completed."
