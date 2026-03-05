#!/bin/bash
# Run Playwright e2e tests inside a Linux Docker container
#
# Runs each browser in its own Docker container (matching CI matrix strategy)
# to avoid resource contention that causes advisory lock timeouts.
#
# Prerequisites:
# - Docker must be running
#
# Usage:
#   ./scripts/run-e2e-docker.sh                    # Run all browsers sequentially
#   ./scripts/run-e2e-docker.sh --parallel          # Run all browsers in parallel
#   ./scripts/run-e2e-docker.sh --update-snapshots  # Update visual snapshots
#   E2E_BROWSERS=chromium ./scripts/run-e2e-docker.sh  # Run single browser

set -e

PLAYWRIGHT_VERSION="v1.58.0-noble"
IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}"
PNPM_STORE_VOLUME="fresco-e2e-pnpm-store"
NODE_MODULES_VOLUME="fresco-e2e-node-modules"
NEXT_BUILD_VOLUME="fresco-e2e-next-build"

ALL_BROWSERS=(chromium firefox webkit)
PARALLEL=false

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Parse --parallel flag and collect remaining args
EXTRA_ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--parallel" ] || [ "$arg" = "-p" ]; then
    PARALLEL=true
  else
    EXTRA_ARGS+=("$arg")
  fi
done

# Configure pnpm store mount based on environment
if [ "$GITHUB_ACTIONS" = "true" ]; then
  mkdir -p .pnpm-docker-store
  PNPM_STORE_MOUNT="-v $(pwd)/.pnpm-docker-store:/root/.local/share/pnpm/store"
else
  PNPM_STORE_MOUNT="-v ${PNPM_STORE_VOLUME}:/root/.local/share/pnpm/store"
fi

# Determine which browsers to run
if [ -n "$E2E_BROWSERS" ]; then
  IFS=',' read -ra BROWSERS <<< "$E2E_BROWSERS"
else
  BROWSERS=("${ALL_BROWSERS[@]}")
fi

# Prepare: install dependencies and build into named volumes so browser
# containers can reuse them without racing each other.
prepare() {
  echo "=== Preparing: install + build ==="
  docker run --rm \
    -e CI=true \
    -e INSTALLATION_ID=e2e-test-env \
    -e SKIP_ENV_VALIDATION=true \
    -e DISABLE_ANALYTICS=true \
    -e DISABLE_NEXT_CACHE=true \
    -v "$(pwd)":/work \
    -v /dev/null:/work/.env:ro \
    -v ${NODE_MODULES_VOLUME}:/work/node_modules \
    -v ${NEXT_BUILD_VOLUME}:/work/.next \
    ${PNPM_STORE_MOUNT} \
    -w /work \
    "${IMAGE}" \
    sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && pnpm build"
  echo "=== Prepare complete ==="
}

run_browser() {
  local browser="$1"
  local output_dir="${2:-}"
  local playwright_cmd="pnpm exec playwright test --config=tests/e2e/playwright.config.ts"
  if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
    playwright_cmd="$playwright_cmd ${EXTRA_ARGS[*]}"
  fi

  local output_env=""
  if [ -n "$output_dir" ]; then
    output_env="-e E2E_OUTPUT_DIR=$output_dir"
  fi

  echo ""
  echo "=== Running $browser tests ==="

  docker run --rm \
    -e CI=true \
    -e INSTALLATION_ID=e2e-test-env \
    -e E2E_BROWSERS="$browser" \
    ${output_env} \
    -v "$(pwd)":/work \
    -v /dev/null:/work/.env:ro \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v ${NODE_MODULES_VOLUME}:/work/node_modules \
    -v ${NEXT_BUILD_VOLUME}:/work/.next \
    ${PNPM_STORE_MOUNT} \
    -w /work \
    --add-host=host.docker.internal:host-gateway \
    "${IMAGE}" \
    sh -c "npm i -g pnpm && $playwright_cmd"
}

# When running multiple browsers, prepare shared volumes first
if [ ${#BROWSERS[@]} -gt 1 ]; then
  prepare
fi

if [ "$PARALLEL" = true ] && [ ${#BROWSERS[@]} -gt 1 ]; then
  echo "Running ${#BROWSERS[@]} browsers in parallel..."

  # Clean per-browser output directories
  for browser in "${BROWSERS[@]}"; do
    rm -rf "tests/e2e/test-results-${browser}"
  done

  pids=()
  for browser in "${BROWSERS[@]}"; do
    run_browser "$browser" "./test-results-${browser}" &
    pids+=($!)
  done

  failed_browsers=()
  for i in "${!pids[@]}"; do
    if ! wait "${pids[$i]}"; then
      failed_browsers+=("${BROWSERS[$i]}")
    fi
  done

  # Merge per-browser results into the standard directories
  rm -rf tests/e2e/test-results tests/e2e/playwright-report
  mkdir -p tests/e2e/test-results tests/e2e/playwright-report
  for browser in "${BROWSERS[@]}"; do
    browser_dir="tests/e2e/test-results-${browser}"
    if [ -d "$browser_dir" ]; then
      # Copy test artifacts (screenshots, videos, traces)
      find "$browser_dir" -maxdepth 1 -mindepth 1 -not -name playwright-report -not -name results.json \
        -exec cp -r {} tests/e2e/test-results/ \;
      # Copy HTML report
      if [ -d "$browser_dir/playwright-report" ]; then
        cp -r "$browser_dir/playwright-report" "tests/e2e/playwright-report/${browser}"
      fi
      # Copy JSON results
      if [ -f "$browser_dir/results.json" ]; then
        cp "$browser_dir/results.json" "tests/e2e/test-results/results-${browser}.json"
      fi
      rm -rf "$browser_dir"
    fi
  done
else
  # Sequential mode
  failed_browsers=()
  for browser in "${BROWSERS[@]}"; do
    if [ ${#BROWSERS[@]} -eq 1 ]; then
      # Single browser: install + build inside the test container
      playwright_cmd="pnpm exec playwright test --config=tests/e2e/playwright.config.ts"
      if [ ${#EXTRA_ARGS[@]} -gt 0 ]; then
        playwright_cmd="$playwright_cmd ${EXTRA_ARGS[*]}"
      fi
      docker run --rm \
        -e CI=true \
        -e INSTALLATION_ID=e2e-test-env \
        -e E2E_BROWSERS="$browser" \
        -v "$(pwd)":/work \
        -v /dev/null:/work/.env:ro \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v ${NODE_MODULES_VOLUME}:/work/node_modules \
        -v ${NEXT_BUILD_VOLUME}:/work/.next \
        ${PNPM_STORE_MOUNT} \
        -w /work \
        --add-host=host.docker.internal:host-gateway \
        "${IMAGE}" \
        sh -c "npm i -g pnpm && pnpm install --frozen-lockfile && $playwright_cmd" \
        || failed_browsers+=("$browser")
    else
      run_browser "$browser" || failed_browsers+=("$browser")
    fi
  done
fi

echo ""
if [ ${#failed_browsers[@]} -eq 0 ]; then
  echo "All browser tests passed."
else
  echo "Tests failed for: ${failed_browsers[*]}"
  exit 1
fi
