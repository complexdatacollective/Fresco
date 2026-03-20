# E2E Tests - AI Assistant Guide

## Architecture

Tests run across **3 browsers** (Chromium, Firefox, WebKit) x **5 environments** (setup, dashboard, api, interview, preview) = **15 isolated instances**, each with its own PostgreSQL container and Next.js server.

Each environment has its own isolated database — no cross-environment coordination is needed. Tests within an environment share a single DB but use `restoreSnapshot()` to reset state before mutation tests.

### Configuration

The `config/test-config.ts` file is the single source of truth:

- **`BROWSERS`** array: `[chromium, firefox, webkit]` with device configs
- **`ENVIRONMENTS`** array: `[setup, dashboard, api, interview, preview]` with seed functions and auth flags
- Pure functions derive everything: `getProjects()`, `getEnvironmentInstances()`, `getContextMappings()`

To add/remove a browser, edit the `BROWSERS` array. To add an environment, edit `ENVIRONMENTS`.

### Environments

- **setup**: Unconfigured app (fresh install) for onboarding wizard tests
- **dashboard**: Fully configured app with seeded data for dashboard tests (requires auth). Read-only tests only — no mutations.
- **api**: Configured app for API-only tests (no auth, no browser). Mutations use `restoreSnapshot()`.
- **interview**: Configured app for interview browser tests (no auth). Mutations use `restoreSnapshot()`.
- **preview**: Configured app for preview mode browser tests (no auth). Mutations use `restoreSnapshot()`.

### Browser Isolation

Each browser gets its own DB + server per environment:

- `setup-chromium`, `setup-firefox`, `setup-webkit`
- `dashboard-chromium`, `dashboard-firefox`, `dashboard-webkit`
- `api-chromium`, `api-firefox`, `api-webkit`
- `interview-chromium`, `interview-firefox`, `interview-webkit`
- `preview-chromium`, `preview-firefox`, `preview-webkit`

```
Global Setup
├── Build standalone Next.js (E2E_TEST=true)
├── Start asset server (port 4200, serves .e2e-assets/)
├── For each browser x environment (15 instances, in parallel):
│   ├── Start PostgreSQL testcontainer
│   ├── Run Prisma migrations
│   ├── Seed test data
│   ├── Start Next.js server (unique port)
│   └── Create initial DB snapshot (JSON)
└── Save context file for workers

Test Workers (fullyParallel: true)
├── Dashboard tests: read-only, no database fixture needed
├── Mutation tests: call restoreSnapshot() at the start of each test
│   └── TRUNCATE + INSERT from snapshot JSON
└── Visual snapshots: toHaveScreenshot() with animation disabling

Global Teardown
├── Kill Next.js processes
├── Stop asset server
├── Stop PostgreSQL containers
└── Clear context file
```

## File Structure

```
tests/e2e/
├── config/
│   └── test-config.ts           # BROWSERS, ENVIRONMENTS, derived functions
├── playwright.config.ts         # Generated projects from test-config
├── global-setup.ts              # Infrastructure startup (15 instances)
├── global-teardown.ts           # Cleanup
├── helpers/
│   ├── testDatabase.ts          # PostgreSQL container + snapshots
│   ├── appServer.ts             # Next.js process lifecycle
│   ├── assetServer.ts           # HTTP server for protocol assets
│   ├── testDataBuilder.ts       # Test data factory (raw SQL)
│   ├── seed.ts                  # Per-environment seed functions
│   ├── logger.ts                # Structured logging
│   ├── context.ts               # Worker context sharing (JSON)
│   ├── prisma.ts                # Test Prisma client factory
│   ├── expectations.ts          # URL assertion helpers
│   ├── dialog.ts                # Dialog interaction helpers
│   ├── table.ts                 # Data table helpers
│   ├── rowActions.ts            # Row action dropdown helpers
│   ├── previewProtocol.ts       # Test protocol factory for preview tests
│   └── form.ts                  # Form field helpers (data-field-name)
├── fixtures/
│   ├── test.ts                  # Extended test with database + app fixtures
│   ├── app-fixture.ts           # App-level state fixture (settings, API tokens)
│   ├── interview-test.ts        # Interview fixtures (interview, stage, protocol)
│   ├── interview-fixture.ts     # Interview page object model
│   ├── stage-fixture.ts         # Stage interaction fixture
│   └── protocol-fixture.ts      # Protocol installation fixture
├── data/
│   ├── Development.netcanvas         # Full development protocol
│   ├── Sample Protocol v4.netcanvas  # Sample v4 protocol
│   ├── silos.netcanvas               # SILOS interview protocol
│   ├── invalid-schema.netcanvas      # Invalid schema (for error tests)
│   ├── missing-protocol-json.netcanvas # Missing protocol.json (for error tests)
│   └── not-a-zip.netcanvas           # Invalid ZIP file (for error tests)
└── specs/
    ├── setup/onboarding.spec.ts
    ├── auth/login.spec.ts
    ├── dashboard/
    │   ├── overview.spec.ts
    │   ├── protocols.spec.ts
    │   ├── participants.spec.ts
    │   ├── interviews.spec.ts
    │   ├── settings.spec.ts
    │   ├── protocol-import.spec.ts
    │   └── onboard-integration.spec.ts
    ├── api/
    │   └── (API-only tests)
    ├── interview/
    │   └── (interview browser tests)
    └── preview/
        └── (preview mode browser tests)
```

## Playwright Projects

Projects are generated dynamically from `BROWSERS x ENVIRONMENTS`. For each browser:

| Project Pattern            | Tests            | Auth                           | Parallel |
| -------------------------- | ---------------- | ------------------------------ | -------- |
| `setup-{browser}`          | specs/setup/     | None                           | Serial   |
| `auth-dashboard-{browser}` | specs/auth/      | None (saves per-browser state) | N/A      |
| `dashboard-{browser}`      | specs/dashboard/ | storageState from auth         | Yes      |
| `api-{browser}`            | specs/api/       | None                           | Yes      |
| `interview-{browser}`      | specs/interview/ | None                           | Yes      |
| `preview-{browser}`        | specs/preview/   | None                           | Yes      |

Dashboard depends on its browser-specific auth project completing first. Auth state is saved to per-browser paths (e.g., `.auth/dashboard-chromium.json`).

The `api`, `interview`, and `preview` environments use the same seed data as `dashboard` but without authentication, making them suitable for testing unauthenticated endpoints and interview/preview flows.

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

### Dashboard tests (read-only, no database fixture)

Dashboard tests only read seeded data — they never mutate the database. Since each environment has its own isolated DB, no locking or snapshot restoration is needed.

```ts
import { test, expect } from '../../fixtures/test.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/my-feature');
  });

  test('displays heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'My Feature' }),
    ).toBeVisible();
  });
});
```

### Mutation tests (with snapshot restore)

Tests that modify database state call `database.restoreSnapshot()` at the start to ensure a clean state. Use `test.describe.configure({ mode: 'serial' })` if tests depend on sequential execution.

```ts
test.describe('Mutations', () => {
  test.describe.configure({ mode: 'serial' });

  test('creates a record', async ({ page, database }) => {
    await database.restoreSnapshot();
    // ... test that modifies data
  });
});
```

### Read-only tests

```ts
test('displays heading', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

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
// Bad - breaks when copy changes
await expect(page.getByTestId('welcome-message')).toContainText(
  'Welcome to Fresco',
);
await expect(page.getByRole('heading')).toHaveText('Dashboard');

// Good - tests structure, not content
await expect(page.getByTestId('page-header')).toBeVisible();
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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
  // Creates 7 snapshots: dashboard-phone.png, dashboard-tablet-portrait.png,
  // dashboard-tablet-landscape.png, dashboard-laptop.png, dashboard-desktop.png,
  // dashboard-desktop-lg.png, dashboard-desktop-xl.png
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

| Name             | Width | Notes          |
| ---------------- | ----- | -------------- |
| phone            | 320   | Minimum mobile |
| tablet-portrait  | 768   | iPad Mini      |
| tablet-landscape | 1024  | iPad Pro 11"   |
| laptop           | 1280  | Small laptops  |
| desktop          | 1536  | Standard       |
| desktop-lg       | 1920  | Full HD        |
| desktop-xl       | 2560  | 2K/4K displays |

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

### URL assertions (`helpers/expectations.ts`)

**Always use `expectURL()` instead of `expect(page).toHaveURL()`** for URL assertions. This helper provides a consistent timeout (15s) that works reliably in CI environments where navigation may be slower.

```ts
import { expectURL } from '../../helpers/expectations.js';

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

### Table helpers (`helpers/table.ts`)

- `waitForTable(page, { minRows? })` — Wait for table with optional min rows
- `searchTable(page, text)` — Fill search input
- `clearSearch(page)` — Clear search
- `selectAllRows(page)` — Click header checkbox
- `getTableRowCount(page)` — Count visible rows
- `clickSortColumn(page, name)` — Click sortable header

### Row action helpers (`helpers/rowActions.ts`)

- `getFirstRow(page)` — Get first table row
- `openRowActions(row)` — Open the actions dropdown

### Database fixture methods

The `database` fixture provides database access and snapshot management. Available in all tests.

- `database.restoreSnapshot(name?)` — Restore database to initial seeded state. Call at the start of any test that mutates data.
- `database.prisma` — Prisma client for direct database queries (e.g., `database.prisma.interview.count()`).
- `database.connectionUri` — Raw PostgreSQL connection string (rarely needed).

### App fixture methods

The `app` fixture provides app-level state manipulation. Available in all tests.

- `app.setSetting(key, value)` — Upsert an AppSettings row.
- `app.getSetting(key)` — Read an AppSettings value (returns null if not set).
- `app.createApiToken(description)` — Create an API token, returns the token string.

### Protocol fixture methods

The `protocol` fixture is available in interview tests (import from `fixtures/interview-test.js`). It manages real `.netcanvas` protocol file installation with automatic cleanup via Playwright fixture teardown.

**Installation & Interview Creation:**

- `protocol.install(protocolPath)` — Install a `.netcanvas` file (extracts assets to `.e2e-assets/`, inserts into DB, rewrites `asset://` URLs to asset server). Returns `InstalledProtocol` with `protocolId`, `name`, `stages`, `codebook`, and `assetBasePath`.
- `protocol.createInterview(protocolId, participantIdentifier?)` — Create a Participant + Interview for the protocol. Returns interview ID.
- `protocol.uninstall(protocolId)` — Remove a specific protocol and its assets.

**Network State Inspection (for debugging):**

- `protocol.getNetworkState(interviewId)` — Get current network state from the database (`nodes`, `edges`, `ego`, `currentStep`).
- `protocol.waitForNodes(interviewId, expectedCount, options?)` — Poll the database until `expectedCount` nodes exist. Useful for waiting for client-server sync.
- `protocol.logNetworkState(interviewId)` — Log the current network state for debugging.

Cleanup is automatic — no `afterAll` needed.

**Asset Handling:** Protocol assets are extracted to `.e2e-assets/{protocolId}/` and served via a dedicated HTTP server on port 4200. The `asset://` URLs in the protocol JSON are rewritten to `http://localhost:4200/{protocolId}/filename`.

## Adding New Tests

1. Create spec file in appropriate `specs/` subdirectory
2. Import from `../../fixtures/test.js`
3. Dashboard tests: just write tests, no database fixture needed
4. Mutation tests: call `database.restoreSnapshot()` at the start of each test
5. Use `test.describe.configure({ mode: 'serial' })` for tests that must run in order
6. Disable animations before visual snapshots

## Seeded Data (Dashboard Environment)

- **Admin user**: testadmin / TestAdmin123!
- **Protocol**: "Test Protocol" (2 stages, schema v8)
- **Participants**: P001-P010 with labels
- **Interviews**: 5 total (P001: completed+exported, P002: completed, P003-P005: in progress)
- **Events**: 3 activity events

## Key Design Decisions

- Each environment gets its own isolated PostgreSQL container — no cross-environment coordination needed
- Auth tables (User, Session, Key) excluded from snapshots so browser sessions survive restores
- TestDataBuilder uses raw SQL (pg) to avoid Prisma client env validation dependency
- Pre-computed scrypt hash for test password avoids lucia/utils import
- `E2E_TEST=true` at build+runtime eliminates stale cache issues
- Port allocation starts at 4100 to avoid conflicts with the dev server (port 3000) and WebKitGTK's restricted port list on Linux
- `fullyParallel: true` enables tests within a spec file to run in parallel (serial mode overrides this where needed)

### Two Environment Variables for E2E Mode

We use two env vars for E2E mode:

- **`E2E_TEST`** — Set at build/runtime by `appServer.ts`. Used by `next.config.ts` to derive the client-side flag and by server-side code (e.g., `ExportLayer.ts`, test export routes).
- **`NEXT_PUBLIC_E2E_TEST`** — Derived from `E2E_TEST` in `next.config.ts`. Inlined into client bundles at build time. Used by client components like `VideoPlayer` to disable video autoplay/preload.

**Why two vars?** The project has `dotenv` installed, which interferes with Next.js's `NEXT_PUBLIC_*` handling. `NEXT_PUBLIC_*` env vars are not readable in `next.config.ts` when dotenv is present. By reading `E2E_TEST` (which dotenv doesn't interfere with) and explicitly setting `NEXT_PUBLIC_E2E_TEST` in `next.config.ts`'s `env` object, we ensure the value is inlined at build time.

### Asset Server for Protocol Files

Protocol assets (images, videos, audio) are served via a dedicated HTTP server on port 4200 instead of relying on Next.js's public directory:

- Assets are extracted to `.e2e-assets/{protocolId}/` during protocol installation
- `asset://` URLs are rewritten to `http://localhost:4200/{protocolId}/filename`
- This avoids requiring a rebuild when protocols are installed dynamically

### Video Handling in E2E Mode

Videos crash headless browsers (especially WebKit) when autoplay or preload is enabled. When `NEXT_PUBLIC_E2E_TEST=true`:

- `autoPlay` is disabled
- `preload` is set to `'none'`
- Loading spinner is hidden (since video never loads)

See `lib/interviewer/Interfaces/Information/Information.tsx` for implementation.
