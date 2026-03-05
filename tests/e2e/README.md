# E2E Tests

End-to-end tests for Fresco using Playwright, Testcontainers, and standalone Next.js.

## Prerequisites

- Docker running (for PostgreSQL testcontainers)
- Node.js 20+
- pnpm 10+

## Commands

```bash
# Run all browsers in Docker (consistent snapshots, matches CI)
pnpm test:e2e

# Run a single browser
./scripts/run-e2e-docker.sh --project="*-chromium"
./scripts/run-e2e-docker.sh --project="*-firefox"
./scripts/run-e2e-docker.sh --project="*-webkit"

# Update visual snapshots (must run in Docker)
pnpm test:e2e:update-snapshots

# Update snapshots for a single browser
./scripts/run-e2e-docker.sh --project="*-chromium" --update-snapshots
```

## Architecture

Each test run spins up **3 browsers x 2 environments = 6 isolated instances**:

- 6 PostgreSQL containers via testcontainers
- 6 standalone Next.js server processes

Each browser (Chromium, Firefox, WebKit) gets its own DB + server per environment, providing full browser isolation. Tests run against real servers with real databases. Mutation tests use database snapshot/restore for isolation.

The `config/test-config.ts` file defines `BROWSERS` and `ENVIRONMENTS` arrays as the single source of truth. All Playwright projects, environment instances, and context mappings are derived from these arrays.

## Test Environments

| Environment | Purpose           | Seed State                                          |
| ----------- | ----------------- | --------------------------------------------------- |
| setup       | Onboarding wizard | Unconfigured app (fresh install)                    |
| dashboard   | Dashboard pages   | Admin user, protocol, 10 participants, 5 interviews |

## Visual Snapshots

Visual regression snapshots must be generated in Docker to ensure consistent font rendering:

```bash
pnpm test:e2e:update-snapshots
```

Snapshots are stored in per-browser subdirectories under `visual-snapshots/` (e.g., `visual-snapshots/dashboard-chromium/`) and committed to the repository.

## CI Integration

Tests run automatically via GitHub Actions with a **browser matrix strategy** — each browser (Chromium, Firefox, WebKit) runs on a separate runner in parallel. The Docker script (`scripts/run-e2e-docker.sh`) ensures reproducible results across environments.

## Debugging

- **Traces**: Saved on failure to `test-results/`
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **HTML Report**: Generated to `playwright-report/`

View the HTML report:

```bash
npx playwright show-report tests/e2e/playwright-report
```
