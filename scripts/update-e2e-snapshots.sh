#!/bin/bash
# Run e2e tests in a Linux Docker container to generate/update snapshots
# that are compatible with CI (which runs on Linux)
#
# Why Docker is required:
# - CI runs on Linux, so snapshots must be generated in a Linux environment
# - The Playwright Docker image provides a consistent rendering environment
# - The Docker socket is mounted so testcontainers can create PostgreSQL containers
#
# Prerequisites:
# - Docker must be running
# - You should have already run `pnpm build` to create the standalone build

set -e

PLAYWRIGHT_VERSION="v1.57.0-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"

echo "🐳 Running Playwright in Linux container to update snapshots..."
echo "   Image: ${IMAGE}"
echo ""
echo "   This runs tests inside Docker using:"
echo "   - Playwright for browser automation"
echo "   - Testcontainers for PostgreSQL databases"
echo "   - Native Node.js processes for the Next.js app"
echo ""

docker run --rm \
  -e CI=true \
  -v "$(pwd)":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /work \
  --network host \
  "${IMAGE}" \
  sh -c 'npm i -g pnpm && pnpm install --frozen-lockfile && pnpm exec playwright test --config=tests/e2e/playwright.config.ts --update-snapshots'

echo ""
echo "✅ Snapshots updated. Check for new *-linux.png files in test snapshot directories."
