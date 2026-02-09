#!/bin/bash
# Run e2e tests in a Linux Docker container to generate/update snapshots
# that are compatible with CI (which runs on Linux)

set -e

PLAYWRIGHT_VERSION="v1.58.0-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"

echo "🐳 Running Playwright in Linux container to update snapshots..."
echo "   Image: ${IMAGE}"

docker run --rm \
  -e CI=true \
  -v "$(pwd)":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /work \
  --network host \
  "${IMAGE}" \
  sh -c 'npm i -g pnpm && pnpm install --frozen-lockfile && TEST_IMAGE_NAME=fresco-test:latest pnpm exec playwright test --config=tests/e2e/playwright.config.ts --update-snapshots'

echo "✅ Snapshots updated. Check for new *-linux.png files in test snapshot directories."
