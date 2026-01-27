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

Test Workers
├── Read-only tests: parallel, no DB changes
├── Mutation tests: serial, database.isolate(page) per test
│   └── TRUNCATE + INSERT from snapshot before/after
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

### Read-only tests (parallel)

```ts
import { test, expect } from '../../fixtures/test.js';

test('displays heading', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

### Mutation tests (serial, with isolation)

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

`database.isolate(page)` restores the DB snapshot and reloads the page so the UI matches the restored state.

### Visual snapshots

```ts
test('visual snapshot', async ({ page }) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
  });
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot('page-name.png', { fullPage: true });
});
```

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
