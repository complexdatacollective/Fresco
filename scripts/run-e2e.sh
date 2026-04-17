#!/bin/bash
# Run Playwright e2e tests inside the Playwright Docker image.
#
# Prerequisites: Docker must be running.
#
# Usage:
#   ./scripts/run-e2e.sh                    # run all browsers
#   ./scripts/run-e2e.sh --update-snapshots # update visual snapshots
#   ./scripts/run-e2e.sh --project=chromium # run a single browser
#
# For local debug iteration (skips Docker wrapper):
#   pnpm build
#   pnpm exec playwright test --ui

set -e

IMAGE="mcr.microsoft.com/playwright:v1.59.1-noble"

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is not running."
  exit 1
fi

docker run --rm \
  -e CI=true \
  -e SKIP_ENV_VALIDATION=true \
  -e DISABLE_ANALYTICS=true \
  -e E2E_TEST=true \
  -v "$(pwd)":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /work \
  --add-host=host.docker.internal:host-gateway \
  "${IMAGE}" \
  sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && pnpm build && \
    pnpm exec playwright test --config=tests/e2e/playwright.config.ts $*"
