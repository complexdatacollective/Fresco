#!/bin/bash
# Run Playwright e2e tests directly on the host (no Docker wrapper).
#
# Intended for fast local iteration while developing tests. Visual snapshot
# assertions are ignored because host font rendering differs from the Linux
# CI container — use `pnpm test:e2e` / `pnpm test:e2e:update-snapshots` for
# anything snapshot-related.
#
# Postgres testcontainers and the Next.js standalone build are still spun up
# by global-setup; only the browser runtime moves out of Docker.
#
# Prerequisites:
# - Docker running (for Postgres testcontainers)
# - Playwright browsers installed on host: `pnpm exec playwright install chromium`
#
# Usage:
#   pnpm test:e2e:local                                  # chromium, all specs
#   pnpm test:e2e:local --ui                             # UI mode (includes locator picker + recorder)
#   pnpm test:e2e:local specs/dashboard/settings.spec.ts # single spec
#   pnpm test:e2e:local --project=dashboard-chromium     # single project
#   E2E_BROWSERS=firefox pnpm test:e2e:local             # different browser

set -e

# Default to chromium only — running all three browsers locally spins up
# 15 Postgres containers + 15 Next servers, which is slow and memory-heavy.
# Override by exporting E2E_BROWSERS before invoking.
export E2E_BROWSERS="${E2E_BROWSERS:-chromium}"
export SKIP_ENV_VALIDATION=true
export E2E_TEST=true
export DISABLE_ANALYTICS=true
export INSTALLATION_ID=e2e-test-env

exec pnpm exec playwright test \
  --config=tests/e2e/playwright.config.ts \
  --ignore-snapshots \
  "$@"
