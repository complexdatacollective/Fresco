# E2E Test System - AI Assistant Guide

This document provides AI assistants with complete knowledge of the Fresco E2E test system. It documents the actual implementation accurately and includes technical justifications for major design decisions.

## Quick Reference

```bash
# Run all E2E tests (uses Docker for visual consistency)
pnpm test:e2e

# Update visual snapshots (must use Docker for CI compatibility)
pnpm test:e2e:update-snapshots

# Run locally without Docker (visual tests may differ)
pnpm test:e2e:local

# Interactive debugging
pnpm test:e2e:local:ui
pnpm test:e2e:local:debug

# Pause after setup for database inspection
DEBUG_PAUSE=1 pnpm test:e2e

# Force rebuild of Next.js standalone
FORCE_REBUILD=true pnpm test:e2e
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GLOBAL SETUP PROCESS                               │
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │
│  │ PostgreSQL      │   │ PostgreSQL      │   │ PostgreSQL      │            │
│  │ Container       │   │ Container       │   │ Container       │            │
│  │ (setup)         │   │ (dashboard)     │   │ (interview)     │            │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘            │
│           │                     │                     │                      │
│  ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐            │
│  │ Next.js         │   │ Next.js         │   │ Next.js         │            │
│  │ Standalone      │   │ Standalone      │   │ Standalone      │            │
│  │ :3001           │   │ :3002           │   │ :3003           │            │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ SNAPSHOT SERVER (HTTP)  │  FILE-BASED SNAPSHOTS                     │    │
│  │ - POST /clear-cache/:id │  - .snapshots/<suiteId>/initial.json      │    │
│  │   (Restart Next.js)     │  - Created at setup, read/written by tests│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    HTTP (clear-cache only) │ File I/O (snapshots)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLAYWRIGHT WORKER PROCESSES                          │
│                                                                              │
│  ┌─────────────────┐   Context resolution:                                  │
│  │ DatabaseSnapshots│   1. Test file path (suites/dashboard/ → dashboard)   │
│  │ fixture         │   2. Playwright project name                           │
│  │                 │   3. Base URL matching                                  │
│  └─────────────────┘   4. Fallback to interview                             │
│                                                                              │
│  Workers read .context-data.json for connection details                      │
│  Workers read/write .snapshots/ for SQL snapshots (direct DB access)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Design Decisions & Justifications

| Decision                           | Implementation                             | Why                                                                        | Alternatives Rejected                                             |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **SQL-based snapshots**            | TRUNCATE + INSERT with JSON file storage   | Fast (~100ms), no external dependencies, debuggable JSON files             | pg_dump requires binaries; container snapshots are slow (seconds) |
| **Auth table exclusion**           | User, Session, Key excluded from snapshots | Browser sessions remain valid across restores; no re-authentication needed | Including auth would invalidate cookies after every restore       |
| **File-based snapshot storage**    | JSON files in .snapshots/ directory        | Workers execute SQL directly, no HTTP overhead for common operations       | HTTP-based storage requires server coordination, adds latency     |
| **HTTP server (cache clear only)** | Only /clear-cache endpoint remains         | Next.js restart requires process management from global setup              | Full HTTP API was over-engineered for simple file operations      |
| **Native Next.js**                 | Standalone build on host                   | Faster startup (~2s vs ~30s), easier debugging, simpler stack              | Docker app container adds latency and complexity                  |
| **Separate PostgreSQL containers** | One per test context                       | Complete isolation, independent data, parallel execution                   | Shared database requires complex cleanup and is error-prone       |
| **Docker visual snapshots**        | Playwright runs in Linux container         | CI runs Linux; macOS font rendering differs → snapshot mismatches          | Platform-specific baselines multiply maintenance burden           |
| **No Next.js restart on restore**  | SQL restore preserves connections          | Fast restores; database connections remain valid                           | Container snapshots break connections, requiring restart          |

## Directory Structure

```
tests/e2e/
├── playwright.config.ts        # Playwright projects and settings
├── global-setup.ts             # Creates containers, seeds data, starts servers
├── global-teardown.ts          # Cleanup containers and processes
│
├── .auth/
│   └── admin.json              # Generated: stored auth state for dashboard tests
│
├── .context-data.json          # Generated: serialized context for workers
│
├── .snapshots/                 # Generated: SQL snapshots as JSON files
│   ├── setup/initial.json
│   ├── dashboard/initial.json
│   └── interview/initial.json
│
├── config/
│   └── test-config.ts          # Credentials, timeouts, context mappings
│
├── fixtures/
│   ├── fixtures.ts             # Main import: extended test with fixtures
│   ├── snapshot-client.ts      # DatabaseSnapshots class (file-based snapshots + direct DB)
│   ├── visual-snapshots.ts     # VisualSnapshots class, SNAPSHOT_CONFIGS
│   ├── snapshot-server.ts      # HTTP server for cache clearing only
│   ├── native-app-environment.ts  # Next.js process management
│   ├── test-environment.ts     # PostgreSQL container management
│   ├── test-data-builder.ts    # Data seeding utilities
│   ├── context-resolver.ts     # Context resolution for workers
│   └── context-storage.ts      # Serialization helpers
│
├── suites/
│   ├── setup/                  # Tests: initial app configuration (no auth)
│   ├── auth/                   # Tests: creates .auth/admin.json
│   ├── dashboard/              # Tests: admin features (uses stored auth)
│   └── interview/              # Tests: interview flows
│
├── utils/
│   └── logger.ts               # Colored logging utilities
│
└── types/
    └── global.d.ts             # Global type declarations
```

## Test Contexts & Pre-seeded Data

| Context       | Suite ID    | Purpose                   | Pre-seeded Data                                                                                   |
| ------------- | ----------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| **setup**     | `setup`     | Initial app configuration | App initialized but not configured                                                                |
| **dashboard** | `dashboard` | Admin dashboard features  | Admin user, 1 protocol, 10 participants (P001-P010), 5 interviews                                 |
| **interview** | `interview` | Interview flow testing    | Admin user, 1 protocol, 20 participants (P001-P020), 10 interviews, anonymous recruitment enabled |

**Admin Credentials** (all contexts except setup):

- Username: `testadmin`
- Password: `TestAdmin123!`

## Core Patterns

### Import Statement

```typescript
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/fixtures';
```

### Pattern 1: Read-Only Tests (Parallel)

For tests that don't modify data:

```typescript
test.describe.parallel('View participants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test('displays participant list', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('P001')).toBeVisible();
  });

  test('shows participant count', async ({ page }) => {
    await expect(page.getByText('10 participants')).toBeVisible();
  });
});
```

### Pattern 2: Mutation Tests (Serial + Isolation)

For tests that modify data:

```typescript
test.describe.serial('Delete participant', () => {
  test('can delete a participant', async ({ page, database }) => {
    // Restore to known state BEFORE and AFTER test
    const cleanup = await database.isolate('delete-participant');

    await page.goto('/dashboard/participants');
    await page
      .getByRole('row', { name: /P001/ })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText('P001')).not.toBeVisible();

    await cleanup();
  });
});
```

### Pattern 3: Scoped Isolation with withSnapshot

```typescript
test('bulk delete restores correctly', async ({ page, database }) => {
  await database.withSnapshot('bulk-delete', async () => {
    await database.prisma.participant.deleteMany();
    await page.goto('/dashboard/participants');
    await expect(page.getByText('No participants')).toBeVisible();
  });
  // Automatically restored here
});
```

### Pattern 4: Visual Snapshots

```typescript
test('participants page matches snapshot', async ({ page, snapshots }) => {
  await page.goto('/dashboard/participants');
  await snapshots.expectPageToMatchSnapshot(
    SNAPSHOT_CONFIGS.fullPage('participants-page'),
  );
});
```

### Pattern 5: Direct Prisma Access

```typescript
test('verify data setup', async ({ database }) => {
  const count = await database.prisma.participant.count();
  expect(count).toBe(10);

  const protocols = await database.prisma.protocol.findMany();
  expect(protocols).toHaveLength(1);
});
```

## API Reference

### DatabaseSnapshots Fixture

| Method                   | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `isolate(name?)`         | Restores to 'initial' snapshot, returns cleanup function that restores again |
| `createSnapshot(name)`   | Creates a named SQL snapshot                                                 |
| `restoreSnapshot(name)`  | Restores to a named snapshot                                                 |
| `withSnapshot(name, fn)` | Runs function with automatic restore after                                   |
| `clearNextCache()`       | Restarts Next.js server to clear in-memory caches                            |
| `prisma`                 | Direct Prisma client access                                                  |
| `appUrl`                 | The Next.js URL for this context                                             |
| `suiteId`                | The context identifier (setup/dashboard/interview)                           |
| `testData`               | Pre-seeded test data (interview context only)                                |
| `getContextInfo()`       | Debug info about context resolution                                          |

### VisualSnapshots Fixture

| Method                                           | Description                              |
| ------------------------------------------------ | ---------------------------------------- |
| `expectPageToMatchSnapshot(options)`             | Compare full page to baseline            |
| `expectElementToMatchSnapshot(locator, options)` | Compare element to baseline              |
| `waitForStablePage()`                            | Wait for page to be ready for screenshot |

### SNAPSHOT_CONFIGS Presets

| Preset             | Use Case             | Settings                                            |
| ------------------ | -------------------- | --------------------------------------------------- |
| `page(name)`       | Standard viewport    | threshold: 0.1, maxDiffPixels: 100, waitTime: 1000  |
| `fullPage(name)`   | Full scrollable page | threshold: 0.2, maxDiffPixels: 2000, waitTime: 2000 |
| `component(name)`  | Specific element     | threshold: 0.05, maxDiffPixels: 50, waitTime: 500   |
| `table(name)`      | Data tables          | threshold: 0.1, waitForSelector: 'table'            |
| `modal(name)`      | Dialogs              | threshold: 0.05, waitForSelector: '[role="dialog"]' |
| `emptyState(name)` | Empty states         | threshold: 0.2, waitTime: 2000                      |

### VisualSnapshotOptions

```typescript
{
  name: string;              // Snapshot filename (without .png)
  threshold?: number;        // Pixel difference threshold (0.0-1.0)
  maxDiffPixels?: number;    // Maximum different pixels allowed
  animations?: 'disable' | 'allow';
  fullPage?: boolean;        // Full page screenshot
  waitTime?: number;         // Extra wait before screenshot (ms)
  waitForSelector?: string;  // CSS selector to wait for
  viewport?: { width: number; height: number };
  mask?: string[];           // Selectors to hide
  clip?: { x, y, width, height };
}
```

## Playwright Projects

| Project            | Test Match                               | Dependencies     | Auth   | Parallel |
| ------------------ | ---------------------------------------- | ---------------- | ------ | -------- |
| `setup`            | `**/setup/*.spec.ts`                     | -                | None   | No       |
| `auth-dashboard`   | `**/auth/dashboard-setup.spec.ts`        | -                | None   | No       |
| `dashboard-visual` | `**/dashboard/visual-snapshots.spec.ts`  | auth-dashboard   | Stored | Yes      |
| `dashboard`        | `**/dashboard/*.spec.ts` (except visual) | dashboard-visual | Stored | Yes      |
| `interview`        | `**/interview/*.spec.ts`                 | -                | None   | No       |

## Common Tasks

### Adding a New Dashboard Test

1. Create file in `suites/dashboard/my-feature.spec.ts`
2. Import fixtures:
   ```typescript
   import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/fixtures';
   ```
3. Use `test.describe.parallel()` for read-only tests
4. Use `test.describe.serial()` + `database.isolate()` for mutations
5. Run tests: `pnpm test:e2e --grep "my-feature"`

### Adding Visual Snapshots

1. Add snapshot test:
   ```typescript
   test('page visual', async ({ page, snapshots }) => {
     await page.goto('/dashboard/my-page');
     await snapshots.expectPageToMatchSnapshot(
       SNAPSHOT_CONFIGS.fullPage('my-page-dashboard'),
     );
   });
   ```
2. Generate baselines: `pnpm test:e2e:update-snapshots`
3. Verify baselines in `*.spec.ts-snapshots/` directory
4. Commit the `-linux.png` files (CI runs on Linux)

### Adding a New Test Context

1. Update `global-setup.ts`:
   - Create `setupMyContextEnvironment()` function
   - Call `testEnv.create({ suiteId: 'mycontext', setupData: ... })`
   - Register with snapshot server
   - Create initial SQL snapshot
2. Update `playwright.config.ts`:
   - Add new project with `testMatch` and `baseURL`
3. Update `context-resolver.ts`:
   - Add mapping in `suiteToContextMap`
   - Add mapping in `projectToContextMap`
4. Create test directory: `suites/mycontext/`

### Debugging Test Failures

1. **View HTML report**: Open `tests/e2e/playwright-report/index.html`
2. **Interactive debugging**:
   ```bash
   pnpm test:e2e:local:debug
   ```
3. **Inspect database during setup**:
   ```bash
   DEBUG_PAUSE=1 pnpm test:e2e
   # Connect to displayed PostgreSQL URLs
   ```
4. **Check context resolution**:
   ```typescript
   test('debug', async ({ database }) => {
     const info = await database.getContextInfo();
     console.log(info);
   });
   ```

## Troubleshooting

### "No test environment context available"

**Cause**: Test file location doesn't match any context mapping.

**Fix**: Ensure test file is in correct `suites/` subdirectory and project name matches in `playwright.config.ts`.

### Visual snapshot mismatch in CI

**Cause**: Snapshots generated locally on macOS differ from Linux CI.

**Fix**: Always generate snapshots with Docker:

```bash
pnpm test:e2e:update-snapshots
```

### Database state pollution between tests

**Cause**: Mutation test didn't call cleanup.

**Fix**: Always use try/finally or `withSnapshot`:

```typescript
test('mutation', async ({ database }) => {
  const cleanup = await database.isolate('my-test');
  try {
    // ... mutations
  } finally {
    await cleanup();
  }
});
```

### Stale UI after database changes

**Cause**: Next.js data cache not updated.

**Fix**:

```typescript
await database.clearNextCache();
await page.reload();
```

### Tests timing out

**Cause**: Container startup or snapshot operations taking too long.

**Fix**: Increase test timeout:

```typescript
test('slow test', async ({ database }) => {
  test.setTimeout(60000);
  // ...
});
```

### "Snapshot not found" error

**Cause**: Attempting to restore a snapshot that wasn't created.

**Fix**: The 'initial' snapshot is created automatically in global setup. For custom snapshots, call `createSnapshot()` first.

## Implementation Details

### How SQL Snapshots Work

**Creating a snapshot (file-based):**

1. Query all table names (excluding User, Session, Key, \_prisma_migrations)
2. SELECT all rows from each table
3. Write as JSON to `.snapshots/<suiteId>/<name>.json`

**Restoring a snapshot (direct DB access):**

1. Read JSON from `.snapshots/<suiteId>/<name>.json`
2. Begin SERIALIZABLE transaction
3. TRUNCATE all snapshot tables (CASCADE)
4. INSERT all rows from snapshot
5. Commit transaction

Workers execute SQL directly using the `pg` library, eliminating HTTP overhead for snapshot operations. Only `clearNextCache()` uses the HTTP server (to restart Next.js processes managed by global setup).

**Why exclude auth tables**: Browser sessions use cookies that reference Session table rows. If we restore Session table, the cookies become invalid, requiring re-authentication after every restore.

### How Context Resolution Works

Workers need to know which database to connect to. Resolution order:

1. **Test file path**: `suites/dashboard/*.spec.ts` → dashboard context
2. **Project name**: `auth-dashboard` → dashboard context
3. **Base URL**: Match against context appUrls
4. **Fallback**: Use interview context (most feature-rich)

### Generated Files

| File                   | Purpose                                        | Created By                               |
| ---------------------- | ---------------------------------------------- | ---------------------------------------- |
| `.auth/admin.json`     | Playwright storage state with auth cookies     | `auth/dashboard-setup.spec.ts`           |
| `.context-data.json`   | Database URLs, app URLs, snapshot server URL   | `global-setup.ts`                        |
| `.snapshots/`          | SQL snapshots as JSON files for test isolation | `global-setup.ts` + `snapshot-client.ts` |
| `*.spec.ts-snapshots/` | Visual baseline images                         | Playwright with `--update-snapshots`     |

## Notes for AI Assistants

1. **The old documentation was wrong**: It described "container-level snapshots" but the actual implementation uses SQL-based snapshots. This CLAUDE.md documents the real implementation.

2. **SQL snapshots are fast**: ~100ms for snapshot/restore vs seconds for container snapshots. No Next.js restart needed.

3. **Auth is preserved**: User/Session/Key tables are never touched by snapshots, so browser sessions stay valid.

4. **Visual snapshots require Docker**: macOS font rendering differs from Linux. Always use `pnpm test:e2e:update-snapshots` (runs in Docker).

5. **Context auto-detection**: Workers automatically find the right database based on test file path. You rarely need to specify context manually.

6. **Parallel vs Serial**: Read-only tests can run in parallel. Mutation tests need `serial` + `isolate()`.
