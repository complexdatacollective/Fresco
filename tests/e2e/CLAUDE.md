# E2E Tests - AI Assistant Guide

## Architecture

Two isolated test environments run in parallel:

- **setup**: Unconfigured app (fresh install) for onboarding wizard tests
- **dashboard**: Fully configured app with seeded data for dashboard tests

Each environment gets its own PostgreSQL testcontainer and Next.js standalone server process.

```
Global Setup
├── Build standalone Next.js (DISABLE_NEXT_CACHE=true)
├── For each environment:
│   ├── Start PostgreSQL testcontainer
│   ├── Run Prisma migrations
│   ├── Seed test data
│   ├── Start Next.js server (unique port)
│   └── Create initial DB snapshot (JSON)
└── Save context file for workers

Test Workers (parallel via shared/exclusive locks)
├── beforeAll: acquire shared lock, restore snapshot
├── Read-only tests: run with shared lock held (parallel across files)
├── Mutation tests: release shared → acquire exclusive → run → release exclusive → re-acquire shared
│   └── TRUNCATE + INSERT from snapshot before/after
├── afterAll: release shared lock
└── Visual snapshots: toHaveScreenshot() with animation disabling

Global Teardown
├── Kill Next.js processes
├── Stop PostgreSQL containers
└── Clear context file
```

## File Structure

```
tests/e2e/
├── playwright.config.ts         # 3 projects: setup, auth, dashboard
├── global-setup.ts              # Infrastructure startup
├── global-teardown.ts           # Cleanup
├── helpers/
│   ├── TestDatabase.ts          # PostgreSQL container + snapshots
│   ├── AppServer.ts             # Next.js process lifecycle
│   ├── TestDataBuilder.ts       # Test data factory (raw SQL)
│   ├── seed.ts                  # Per-environment seed functions
│   ├── logger.ts                # Structured logging
│   ├── context.ts               # Worker context sharing (JSON)
│   ├── dialog.ts                # Dialog interaction helpers
│   ├── table.ts                 # Data table helpers
│   ├── row-actions.ts           # Row action dropdown helpers
│   └── form.ts                  # Form field helpers (data-field-name)
├── fixtures/
│   ├── db-fixture.ts            # DatabaseIsolation class
│   └── test.ts                  # Extended test with db fixture
└── specs/
    ├── setup/onboarding.spec.ts
    ├── auth/login.spec.ts
    └── dashboard/
        ├── overview.spec.ts
        ├── protocols.spec.ts
        ├── participants.spec.ts
        ├── interviews.spec.ts
        └── settings.spec.ts
```

## Playwright Projects

| Project   | Tests            | Auth                   | Parallel |
| --------- | ---------------- | ---------------------- | -------- |
| setup     | specs/setup/     | None                   | Serial   |
| auth      | specs/auth/      | None (saves state)     | N/A      |
| dashboard | specs/dashboard/ | storageState from auth | Yes      |

Dashboard depends on auth project completing first.

## Test Patterns

### File-level isolation with shared/exclusive locks

Each spec file acquires a **shared lock** at the start to protect read-only tests from concurrent mutations in other workers. This enables parallel execution of read-only tests across files.

```ts
import { test, expect } from '../../fixtures/test.js';

test.describe('My Feature', () => {
  // Acquire shared lock and restore database
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests, before mutations start
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('displays heading', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(
        page.getByRole('heading', { name: 'Dashboard' }),
      ).toBeVisible();
    });
  });

  test.describe('Mutations', () => {
    // Mutation tests use isolate() which handles its own locking
  });
});
```

### Read-only tests (parallel within file)

```ts
test('displays heading', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

### Mutation tests (serial, with exclusive lock)

Mutation tests acquire an **exclusive lock** that waits for all shared locks to release, then blocks all other readers and writers. This ensures mutations are fully isolated.

```ts
test.describe('Mutations', () => {
  test.describe.configure({ mode: 'serial' });

  test('delete item', async ({ page, database }) => {
    const cleanup = await database.isolate(page);
    try {
      // ... test that modifies data
    } finally {
      await cleanup();
    }
  });
});
```

`database.isolate(page)` acquires an exclusive lock, restores the DB snapshot, and reloads the page. The cleanup function restores the snapshot again and releases the exclusive lock.

### Visual snapshots

Visual tests require Docker for consistent font rendering (`pnpm test:e2e` sets `CI=true`). They are automatically skipped when `CI` is not set by using the `visual` fixture.

```ts
test('visual snapshot', async ({ page, visual }) => {
  await visual();
  await expect(page).toHaveScreenshot('page-name.png', { fullPage: true });
});
```

The `visual` fixture skips the test when not in CI. Calling `await visual()` injects a CSS style tag to disable all animations/transitions and waits for JS animations to settle. For mutation visual tests, include all needed fixtures: `async ({ page, database, visual })`.

## Helpers API

### Form helpers (`helpers/form.ts`)

- `fillField(page, fieldName, value)` — Fill a field by `data-field-name`
- `getField(page, fieldName)` — Get field container locator
- `getFieldInput(page, fieldName)` — Get the input element within a field

### Dialog helpers (`helpers/dialog.ts`)

- `waitForDialog(page)` — Wait for dialog to appear
- `openDialog(page, buttonName)` — Click button and wait for dialog
- `closeDialog(page)` — Press Escape to close
- `confirmDeletion(page)` — Click the delete/confirm button
- `submitDialog(page, buttonName?)` — Click submit/save button

### Table helpers (`helpers/table.ts`)

- `waitForTable(page, { minRows? })` — Wait for table with optional min rows
- `searchTable(page, text)` — Fill search input
- `clearSearch(page)` — Clear search
- `selectAllRows(page)` — Click header checkbox
- `getTableRowCount(page)` — Count visible rows
- `clickSortColumn(page, name)` — Click sortable header

### Row action helpers (`helpers/row-actions.ts`)

- `getFirstRow(page)` — Get first table row
- `openRowActions(row)` — Open the actions dropdown
- `deleteSingleItem(page, row)` — Delete via row actions
- `bulkDeleteSelected(page)` — Delete selected rows

### Database fixture methods

The `database` fixture provides direct database access without passing `databaseUrl`:

- `database.restoreSnapshot(name?)` — Acquire shared lock and restore snapshot (call in `beforeAll`)
- `database.releaseReadLock()` — Release the shared lock (call in `afterAll`)
- `database.isolate(page)` — Acquire exclusive lock, restore snapshot, reload page; returns cleanup function
- `database.getProtocolId()` — Get first protocol's ID from database
- `database.updateAppSetting(key, value)` — Update an AppSettings row
- `database.getParticipantCount(identifier?)` — Count participants (optionally filter by identifier)
- `database.getDatabaseUrl()` — Get raw connection string (rarely needed)

## Adding New Tests

1. Create spec file in appropriate `specs/` subdirectory
2. Import from `../../fixtures/test.js` for database fixture access
3. Use `test.describe.configure({ mode: 'serial' })` for mutation tests
4. Wrap mutations with `database.isolate(page)` for cleanup
5. Disable animations before visual snapshots

## Seeded Data (Dashboard Environment)

- **Admin user**: testadmin / TestAdmin123!
- **Protocol**: "Test Protocol" (2 stages, schema v8)
- **Participants**: P001-P010 with labels
- **Interviews**: 5 total (P001: completed+exported, P002: completed, P003-P005: in progress)
- **Events**: 3 activity events

## Key Design Decisions

- Auth tables (User, Session, Key) excluded from snapshots so browser sessions survive restores
- TestDataBuilder uses raw SQL (pg) to avoid Prisma client env validation dependency
- Pre-computed scrypt hash for test password avoids lucia/utils import
- `DISABLE_NEXT_CACHE=true` at build+runtime eliminates stale cache issues
- Port allocation starts at 3100 to avoid conflicts with dev server
