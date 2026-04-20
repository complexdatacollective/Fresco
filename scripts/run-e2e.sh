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
#
# node_modules and .next are backed by named Docker volumes, not the host
# bind mount. Without this, `pnpm install` inside the Linux container
# overwrites the host's native bindings (rolldown, @next/swc, sharp, etc.)
# with Linux-x64 binaries, corrupting local dev on macOS/arm64. The volumes
# persist between runs so --frozen-lockfile skips redundant installs, and
# can be wiped with `docker volume rm fresco-e2e-node-modules
# fresco-e2e-next-cache` if they ever drift.

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
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  -v "$(pwd)":/work \
  -v fresco-e2e-node-modules:/work/node_modules \
  -v fresco-e2e-next-cache:/work/.next \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /work \
  --add-host=host.docker.internal:host-gateway \
  "${IMAGE}" \
  sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && pnpm build && \
    pnpm exec playwright test --config=tests/e2e/playwright.config.ts $*"
