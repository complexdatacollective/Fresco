#!/bin/bash
# Run Playwright e2e tests inside a Linux Docker container
#
# All browsers run in parallel within a single container. Each
# browser×environment gets its own PostgreSQL container and Next.js
# server, so they are fully isolated.
#
# Prerequisites:
# - Docker must be running
#
# Usage:
#   ./scripts/run-e2e-docker.sh                    # Run all browsers
#   ./scripts/run-e2e-docker.sh --update-snapshots  # Update visual snapshots
#   ./scripts/run-e2e-docker.sh --project="*-chromium"  # Run single browser
#   E2E_BROWSERS=chromium ./scripts/run-e2e-docker.sh   # Start only chromium environments

set -e

PLAYWRIGHT_VERSION="v1.59.1-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"
PNPM_STORE_VOLUME="fresco-e2e-pnpm-store"
NODE_MODULES_VOLUME="fresco-e2e-node-modules"
NEXT_BUILD_VOLUME="fresco-e2e-next-build"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Configure pnpm store mount based on environment
if [ "$GITHUB_ACTIONS" = "true" ]; then
  mkdir -p .pnpm-docker-store
  PNPM_STORE_MOUNT="-v $(pwd)/.pnpm-docker-store:/root/.local/share/pnpm/store"
else
  PNPM_STORE_MOUNT="-v ${PNPM_STORE_VOLUME}:/root/.local/share/pnpm/store"
fi

# If this is a git worktree, mount the main .git directory so git works inside the container
GIT_WORKTREE_MOUNT=""
if [ -f .git ]; then
  GITDIR=$(sed 's/gitdir: //' .git)
  MAIN_GIT_DIR=$(cd "$(dirname "$(dirname "$GITDIR")")" && pwd)
  GIT_WORKTREE_MOUNT="-v ${MAIN_GIT_DIR}:${MAIN_GIT_DIR}:ro"
fi

# Determine which browsers to run
if [ -n "$E2E_BROWSERS" ]; then
  BROWSER_LIST="$E2E_BROWSERS"
else
  BROWSER_LIST="chromium,firefox,webkit"
fi

docker run --rm \
  -e CI=true \
  -e INSTALLATION_ID=e2e-test-env \
  -e SKIP_ENV_VALIDATION=true \
  -e DISABLE_ANALYTICS=true \
  -e E2E_TEST=true \
  -e E2E_BROWSERS="$BROWSER_LIST" \
  -v "$(pwd)":/work \
  -v /dev/null:/work/.env:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ${NODE_MODULES_VOLUME}:/work/node_modules \
  -v ${NEXT_BUILD_VOLUME}:/work/.next \
  ${GIT_WORKTREE_MOUNT} \
  ${PNPM_STORE_MOUNT} \
  -w /work \
  --add-host=host.docker.internal:host-gateway \
  "${IMAGE}" \
  sh -c "git config --global --add safe.directory /work && \
    BUILD_HASH=\$({ git rev-parse HEAD; git diff HEAD; git ls-files --others --exclude-standard | git hash-object --stdin-paths 2>/dev/null; true; } | md5sum | cut -d' ' -f1) && \
    npm i -g pnpm && pnpm install --frozen-lockfile && \
    if [ -f .next/BUILD_HASH ] && [ \"\$(cat .next/BUILD_HASH)\" = \"\$BUILD_HASH\" ]; then \
      echo 'Skipping build (no changes since last build)'; \
    else \
      pnpm build && echo \"\$BUILD_HASH\" > .next/BUILD_HASH; \
    fi && \
    pnpm exec playwright test --config=tests/e2e/playwright.config.ts $*"
