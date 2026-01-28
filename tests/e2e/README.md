# E2E Tests

End-to-end tests for Fresco using Playwright, Testcontainers, and standalone Next.js.

## Prerequisites

- Docker running (for PostgreSQL testcontainers)
- Node.js 20+
- pnpm 10+

## Commands

```bash
# Run in Docker (consistent snapshots, matches CI)
pnpm test:e2e

# Run locally (uses your system's Chrome)
pnpm test:e2e:local

# UI mode for debugging
pnpm test:e2e:local:ui

# Debug mode with inspector
pnpm test:e2e:local:debug

# Run specific project
pnpm test:e2e:local -- --project=dashboard

# Run specific spec file
pnpm test:e2e:local -- tests/e2e/specs/dashboard/protocols.spec.ts

# Update visual snapshots (must run in Docker)
pnpm test:e2e:update-snapshots

# Force rebuild before running
FORCE_REBUILD=true pnpm test:e2e
```

## Architecture

Each test run spins up:
- 2 PostgreSQL containers via testcontainers (setup + dashboard environments)
- 2 standalone Next.js server processes (one per environment)

Tests run against these real servers with real databases. Mutation tests use database snapshot/restore for isolation.

## Test Environments

| Environment | Purpose | Seed State |
|------------|---------|------------|
| setup | Onboarding wizard | Unconfigured app (fresh install) |
| dashboard | Dashboard pages | Admin user, protocol, 10 participants, 5 interviews |

## Visual Snapshots

Visual regression snapshots must be generated in Docker to ensure consistent font rendering:

```bash
pnpm test:e2e:update-snapshots
```

Snapshots are stored alongside spec files and committed to the repository.

## CI Integration

Tests run automatically via GitHub Actions. The Docker script (`scripts/run-e2e-docker.sh`) ensures reproducible results across environments.

## Debugging

- **Traces**: Saved on failure to `test-results/`
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **HTML Report**: Generated to `playwright-report/`

View the HTML report:
```bash
npx playwright show-report tests/e2e/playwright-report
```
