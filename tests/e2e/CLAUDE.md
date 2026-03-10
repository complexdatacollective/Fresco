# E2E Tests - AI Assistant Guide

## Architecture

Tests run across **3 browsers** (Chromium, Firefox, WebKit) x **4 environments** (setup, dashboard, api, interview) = **12 isolated instances**, each with its own PostgreSQL container and Next.js server.

### Configuration

The `config/test-config.ts` file is the single source of truth:

- **`BROWSERS`** array: `[chromium, firefox, webkit]` with device configs
- **`ENVIRONMENTS`** array: `[setup, dashboard, api, interview]` with seed functions and auth flags
- Pure functions derive everything: `getProjects()`, `getEnvironmentInstances()`, `getContextMappings()`

To add/remove a browser, edit the `BROWSERS` array. To add an environment, edit `ENVIRONMENTS`.

### Environments

- **setup**: Unconfigured app (fresh install) for onboarding wizard tests
- **dashboard**: Fully configured app with seeded data for dashboard tests (requires auth)
- **api**: Configured app for API-only tests (no auth, no browser)
- **interview**: Configured app for interview/preview browser tests (no auth)

### Browser Isolation

Each browser gets its own DB + server per environment:

- `setup-chromium`, `setup-firefox`, `setup-webkit`
- `dashboard-chromium`, `dashboard-firefox`, `dashboard-webkit`
- `api-chromium`, `api-firefox`, `api-webkit`
- `interview-chromium`, `interview-firefox`, `interview-webkit`

```
Global Setup
├── Build standalone Next.js (DISABLE_NEXT_CACHE=true)
├── For each browser x environment (12 instances, in parallel):
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
├── config/
│   └── test-config.ts           # BROWSERS, ENVIRONMENTS, derived functions
├── playwright.config.ts         # Generated projects from test-config
├── global-setup.ts              # Infrastructure startup (12 instances)
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
│   ├── test.ts                  # Extended test with db fixture (browser tests)
│   ├── api-test.ts              # Extended test for API-only tests
│   └── preview-protocol.ts      # Test protocol factory for preview tests
└── specs/
    ├── setup/onboarding.spec.ts
    ├── auth/login.spec.ts
    ├── dashboard/
    │   ├── overview.spec.ts
    │   ├── protocols.spec.ts
    │   ├── participants.spec.ts
    │   ├── interviews.spec.ts
    │   └── settings.spec.ts
    ├── api/
    │   └── preview-mode.spec.ts # API-only preview tests
    └── interview/
        └── preview-mode.spec.ts # Browser preview tests
```

## Playwright Projects

Projects are generated dynamically from `BROWSERS x ENVIRONMENTS`. For each browser:

| Project Pattern            | Tests              | Auth                           | Parallel |
| -------------------------- | ------------------ | ------------------------------ | -------- |
| `setup-{browser}`          | specs/setup/       | None                           | Serial   |
| `auth-dashboard-{browser}` | specs/auth/        | None (saves per-browser state) | N/A      |
| `dashboard-{browser}`      | specs/dashboard/   | storageState from auth         | Yes      |
| `api-{browser}`            | specs/api/         | None                           | Yes      |
| `interview-{browser}`      | specs/interview/   | None                           | Yes      |

Dashboard depends on its browser-specific auth project completing first. Auth state is saved to per-browser paths (e.g., `.auth/dashboard-chromium.json`).

The `api` and `interview` environments use the same seed data as `dashboard` but without authentication, making them suitable for testing unauthenticated endpoints and interview flows.

### Running a single browser

```bash
# In Docker
./scripts/run-e2e-docker.sh --project="*-chromium"
./scripts/run-e2e-docker.sh --project="*-firefox"

# Filter in CI
pnpm test:e2e -- --project="*-webkit"
```

### CI matrix strategy

CI runs each browser on a separate runner via GitHub Actions matrix strategy (`fail-fast: false`), so all browsers run even if one fails.

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

  test('delete item', async ({ page, database }, testInfo) => {
    const cleanup = await database.isolate(page, testInfo);
    try {
      // ... test that modifies data
    } finally {
      await cleanup();
    }
  });
});
```

`database.isolate(page, testInfo)` acquires an exclusive lock, restores the DB snapshot, and returns a cleanup function. Pass `testInfo` so lock wait time is excluded from the test timeout — without it, tests queued behind other workers may time out waiting for the lock.

### Element Selectors

Use resilient selectors that won't break with minor UI changes. Follow this priority order:

#### 1. Semantic `getByRole()` queries (preferred)

Role-based queries are accessible and resilient to text/styling changes:

```ts
// Buttons, links, inputs
page.getByRole('button', { name: /add user/i });
page.getByRole('link', { name: 'Dashboard' });

// Headings with level
page.getByRole('heading', { name: 'Settings', level: 1 });

// Form controls
page.getByRole('switch');
page.getByRole('checkbox');
page.getByRole('dialog');
page.getByRole('table');
```

#### 2. `getByTestId()` for non-semantic elements

When there's no semantic role, use `data-testid` attributes:

```ts
// Good - stable testId
page.getByTestId('user-row-testadmin');
page.getByTestId('anonymous-recruitment-field');

// Combine with role for nested elements
page.getByTestId('anonymous-recruitment-field').getByRole('switch');
```

#### 3. Avoid these fragile patterns

**Never use in tests:**

| Pattern                    | Problem                           | Alternative                                  |
| -------------------------- | --------------------------------- | -------------------------------------------- |
| `getByText('Settings')`    | Breaks with text changes, i18n    | `getByRole('heading', { name: 'Settings' })` |
| `toContainText()`          | Ties tests to specific copy       | `toBeVisible()` on element                   |
| `toHaveText()`             | Ties tests to specific copy       | `toBeVisible()` on element                   |
| `.first()`                 | Tied to DOM order                 | Add unique testId                            |
| `.locator('..')`           | Parent traversal is fragile       | Add testId to parent                         |
| `.locator('#id')`          | Inconsistent with other selectors | `getByTestId()`                              |
| `page.locator('text=...')` | Same issues as getByText          | Use role or testId                           |

#### 4. Test element presence, not text content

Avoid assertions on specific text content. This ties tests to copy and prevents refactoring:

```ts
// ❌ Bad - breaks when copy changes
await expect(page.getByTestId('welcome-message')).toContainText(
  'Welcome to Fresco',
);
await expect(page.getByRole('heading')).toHaveText('Dashboard');

// ✅ Good - tests structure, not content
await expect(page.getByTestId('page-header')).toBeVisible();
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
```

**Example refactoring:**

```ts
// ❌ Bad - fragile, tied to DOM structure
const toggle = page
  .getByText('Anonymous Recruitment')
  .locator('..')
  .locator('..')
  .getByRole('switch');

// ✅ Good - stable, semantic
const toggle = page
  .getByTestId('anonymous-recruitment-field')
  .getByRole('switch');
```

#### 5. Adding testIds to components

When adding testIds, follow these patterns used in the codebase:

- **SettingsCard**: `data-testid="{id}-card"` (e.g., `user-management-card`)
- **SettingsField**: `testId` prop → `data-testid` (e.g., `anonymous-recruitment-field`)
- **User rows**: `data-testid="user-row-{username}"`
- **Token rows**: `data-testid="token-row-{description}"`
- **Delete buttons**: `data-testid="delete-user-{username}"` or `delete-token-{description}`
- **Field errors**: Auto-generated as `{fieldName}-field-error`

### Visual snapshots

Visual tests require Docker for consistent font rendering (`pnpm test:e2e` sets `CI=true`). They are automatically skipped when `CI` is not set. Snapshots are stored in per-project subdirectories under `tests/e2e/visual-snapshots/{projectName}/` (e.g., `visual-snapshots/dashboard-chromium/`).

#### `capturePage(name, options?)` - Full page at multiple viewports

Captures the full-height page at all Tailwind breakpoint sizes:

```ts
test('dashboard page', async ({ page, capturePage }) => {
  await page.goto('/dashboard');
  await capturePage('dashboard');
  // Creates 6 snapshots: dashboard-phone.png, dashboard-tablet.png,
  // dashboard-tablet-portrait.png, dashboard-laptop.png, dashboard-desktop.png,
  // dashboard-desktop-lg.png
});
```

Options:

- `viewports?: Viewport[]` - Override default viewports
- `mask?: Locator[]` - Elements to mask in all captures

```ts
// With masking
await capturePage('settings', {
  mask: [page.getByTestId('app-version')],
});
```

Default viewports (synced with `--breakpoint-*` in `styles/globals.css`). All captures are full-height (the entire scrollable page is captured):

| Name            | Width | Notes          |
| --------------- | ----- | -------------- |
| phone           | 320   | Minimum mobile |
| tablet          | 768   | iPad Mini      |
| tablet-portrait | 1024  | iPad Pro 11"   |
| laptop          | 1280  | Small laptops  |
| desktop         | 1920  | Full HD        |
| desktop-lg      | 2560  | 2K/4K displays |

#### `captureElement(element, name, options?)` - Single element capture

Captures a specific element (dialogs, components) at current viewport:

```ts
test('add user dialog', async ({ page, captureElement }) => {
  await page.getByRole('button', { name: /add user/i }).click();
  const dialog = page.getByRole('dialog');
  await captureElement(dialog, 'add-user-dialog');
  // Creates: add-user-dialog.png
});
```

Options:

- `mask?: Locator[]` - Elements to mask within the element

#### Snapshot naming

Since all snapshots go into a shared directory, names must be unique across all tests. Use descriptive names like `settings-add-user-dialog.png` rather than just `dialog.png`.

## Helpers API

### URL assertions (`fixtures/test.ts`)

**Always use `expectURL()` instead of `expect(page).toHaveURL()`** for URL assertions. This helper provides a consistent timeout (15s) that works reliably in CI environments where navigation may be slower.

```ts
import { expectURL } from '../../fixtures/test.js';

// Use this:
await expectURL(page, /\/dashboard\/protocols/);

// NOT this:
await expect(page).toHaveURL(/\/dashboard\/protocols/);
```

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
- `database.isolate(page, testInfo?)` — Acquire exclusive lock, restore snapshot; returns cleanup function. Pass `testInfo` to exclude lock wait time from the test timeout
- `database.isolateApi(testInfo?)` — Same as `isolate()` but for API-only tests that don't need a browser page
- `database.getProtocolId()` — Get first protocol's ID from database
- `database.updateAppSetting(key, value)` — Update an AppSettings row
- `database.getParticipantCount(identifier?)` — Count participants (optionally filter by identifier)
- `database.deleteUser(username)` — Delete a user by username (cascades to Session/Key). Use at the start of mutation tests that create users, to handle retries since the User table is excluded from snapshots
- `database.getDatabaseUrl()` — Get raw connection string (rarely needed)

**Preview mode helpers:**

- `database.enablePreviewMode(requireAuth?)` — Enable preview mode with optional auth requirement
- `database.disablePreviewMode()` — Disable preview mode
- `database.createPreviewProtocol(options?)` — Create a preview protocol for testing
- `database.deletePreviewProtocol(id)` — Delete a preview protocol
- `database.createApiToken(description)` — Create an API token for authenticated requests
- `database.getInterviewCount()` — Count Interview records (verify preview doesn't persist data)

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
- Port allocation starts at 4100 to avoid conflicts with the dev server (port 3000) and WebKitGTK's restricted port list on Linux
