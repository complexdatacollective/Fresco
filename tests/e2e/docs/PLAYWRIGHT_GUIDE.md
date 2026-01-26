# Fresco Playwright E2E Testing Guide

## Overview

The Fresco Playwright testing system is a sophisticated E2E testing framework that uses:

- **Docker containers** for isolated, reproducible test environments
- **Three parallel test contexts** (setup, dashboard, interviews) with separate databases
- **Visual regression testing** with automatic snapshot comparison
- **Database snapshot/restore** for test isolation
- **Automatic authentication state** management

---

## Directory Structure

```
tests/e2e/
├── playwright.config.ts        # Main Playwright configuration
├── global-setup.ts             # Spins up Docker containers & seeds data
├── global-teardown.ts          # Cleans up containers
├── .auth/admin.json            # Stored authentication state
├── .context-data.json          # Serialized context data (generated)
│
├── config/
│   └── test-config.ts          # Test constants (credentials, timeouts)
│
├── fixtures/
│   ├── test.ts                 # Extended test fixtures (main import)
│   ├── database-snapshots.ts   # Database isolation utilities
│   ├── visual-snapshots.ts     # Screenshot comparison utilities
│   ├── test-environment.ts     # Docker environment management
│   ├── test-data-builder.ts    # Test data seeding utilities
│   ├── worker-context.ts       # Context resolution for workers
│   └── context-storage.ts      # Context serialization
│
├── suites/
│   ├── setup/                  # Initial app setup tests
│   ├── auth/                   # Authentication setup
│   ├── dashboard/              # Dashboard tests (run with auth)
│   └── interview/              # Interview flow tests
│
└── utils/
    └── logger.ts               # Colored logging utilities
```

---

## Quick Start

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with Playwright UI (debugging)
pnpm test:e2e:ui

# Run with debugger
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e --grep "Participants"

# Update visual snapshots
pnpm test:e2e --update-snapshots
```

### Prerequisites

1. Docker must be running
2. Build the test image first (automatic if not set):

   ```bash
   docker build --build-arg DISABLE_IMAGE_OPTIMIZATION=true -t fresco-test:latest .
   ```

---

## Test Projects

The system defines **4 Playwright projects** with dependencies:

| Project          | Purpose                   | Base URL        | Auth   | Parallelization |
| ---------------- | ------------------------- | --------------- | ------ | --------------- |
| `setup`          | Initial app configuration | `SETUP_URL`     | None   | Sequential      |
| `auth-dashboard` | Creates auth state        | `DASHBOARD_URL` | None   | Sequential      |
| `dashboard`      | Admin dashboard tests     | `DASHBOARD_URL` | Stored | Parallel        |
| `interview`      | Interview flow tests      | `INTERVIEW_URL` | None   | Sequential      |

**Dependency chain:** `dashboard` depends on `auth-dashboard`

---

## Writing Tests

### Basic Test Structure

Always import from the custom fixtures:

```typescript
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/my-page');
  });

  test('should do something', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Title' })).toBeVisible();
  });
});
```

### Available Fixtures

Every test automatically receives:

| Fixture             | Type                | Description                               |
| ------------------- | ------------------- | ----------------------------------------- |
| `page`              | `Page`              | Standard Playwright page                  |
| `snapshots`         | `VisualSnapshots`   | Visual regression utilities               |
| `database`          | `DatabaseSnapshots` | Database isolation & direct Prisma access |
| `authenticatedPage` | `Page`              | Page with pre-loaded admin credentials    |

---

## Visual Snapshot Testing

### Taking Snapshots

```typescript
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/test';

test('visual snapshot', async ({ page, snapshots }) => {
  await page.goto('/dashboard/participants');

  // Use predefined configs
  await snapshots.expectPageToMatchSnapshot(
    SNAPSHOT_CONFIGS.fullPage('participants-page'),
  );
});
```

### Predefined Configs

| Config                              | Use Case             | Settings                            |
| ----------------------------------- | -------------------- | ----------------------------------- |
| `SNAPSHOT_CONFIGS.page(name)`       | Standard viewport    | threshold: 0.1, maxDiffPixels: 100  |
| `SNAPSHOT_CONFIGS.fullPage(name)`   | Full scrollable page | threshold: 0.2, maxDiffPixels: 1000 |
| `SNAPSHOT_CONFIGS.component(name)`  | Specific element     | threshold: 0.05, maxDiffPixels: 50  |
| `SNAPSHOT_CONFIGS.table(name)`      | Data tables          | Waits for table selector            |
| `SNAPSHOT_CONFIGS.modal(name)`      | Modal dialogs        | Waits for dialog selector           |
| `SNAPSHOT_CONFIGS.emptyState(name)` | Empty states         | Longer wait time (2s)               |

### Custom Options

```typescript
await snapshots.expectPageToMatchSnapshot({
  name: 'custom-snapshot',
  threshold: 0.15,
  maxDiffPixels: 200,
  fullPage: true,
  animations: 'disable',
  waitTime: 1000,
  waitForSelector: '.my-element',
  mask: ['.dynamic-timestamp', '.user-avatar'],
  viewport: { width: 1280, height: 720 },
});
```

### Element Snapshots

```typescript
const table = page.locator('table').first();
await snapshots.expectElementToMatchSnapshot(
  table,
  SNAPSHOT_CONFIGS.component('my-table'),
);
```

---

## Database Isolation

### Why It Matters

Tests that mutate data (create, update, delete) can affect other tests. The `database` fixture provides isolation mechanisms.

### Pattern 1: Parallel Tests (Read-Only)

For tests that only read data, use `test.describe.parallel()`:

```typescript
test.describe.parallel('Read-only tests', () => {
  test('should display list', async ({ page }) => {
    // Safe - no mutations
    await expect(page.locator('table')).toBeVisible();
  });
});
```

### Pattern 2: Serial Tests with Isolation

For tests that mutate data, use `test.describe.serial()` with database isolation:

```typescript
test.describe.serial('Mutation tests', () => {
  test('should delete item', async ({ page, database }) => {
    // Create isolation scope
    const cleanup = await database.isolate('before-delete');

    // Perform mutations
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify
    await expect(page.getByText('No results')).toBeVisible();

    // Restore original state
    await cleanup();
  });
});
```

### Pattern 3: Using `withSnapshot`

For cleaner syntax with automatic cleanup:

```typescript
test('should handle deletion', async ({ page, database }) => {
  await database.withSnapshot('test-deletion', async () => {
    // All mutations in here are automatically rolled back
    await database.prisma.participant.deleteMany();
    await page.reload();
    await expect(page.getByText('No results')).toBeVisible();
  });
  // Database automatically restored here
});
```

### Direct Prisma Access

```typescript
test('direct database access', async ({ database }) => {
  // Read data
  const participants = await database.prisma.participant.findMany();
  expect(participants.length).toBeGreaterThan(0);

  // Mutate (within isolation)
  const cleanup = await database.isolate();
  await database.prisma.participant.create({
    data: { identifier: 'TEST', label: 'Test Participant' },
  });
  await cleanup();
});
```

### Clearing Next.js Cache

After database mutations, the UI may show stale data due to Next.js caching:

```typescript
// Clear cache manually if needed
await database.clearNextCache();
await page.reload();
```

---

## Test Data

### Pre-seeded Data

The global setup creates test data in each context:

**Dashboard Context:**

- 1 admin user (`testadmin` / `TestAdmin123!`)
- 1 protocol
- 10 participants (`P001` - `P010`)

**Interviews Context:**

- 1 admin user
- 1 protocol
- 20 participants (`P001` - `P020`)
- 10 interviews (for participants 1-10)

### Admin Credentials

```typescript
import { ADMIN_CREDENTIALS } from '../../config/test-config';

// { username: 'testadmin', password: 'TestAdmin123!' }
```

---

## Test File Placement

| Test Type           | Directory           | Project        | Notes                      |
| ------------------- | ------------------- | -------------- | -------------------------- |
| Initial setup flow  | `suites/setup/`     | setup          | Fresh database, no auth    |
| Auth state creation | `suites/auth/`      | auth-dashboard | Creates `.auth/admin.json` |
| Dashboard features  | `suites/dashboard/` | dashboard      | Uses stored auth           |
| Interview flow      | `suites/interview/` | interview      | May need different auth    |

---

## Creating a New Test File

### Step 1: Choose the Right Directory

```
suites/dashboard/my-feature.spec.ts  # For dashboard features
```

### Step 2: Basic Template

```typescript
import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

// Parallel tests for read-only operations
test.describe.parallel('My Feature - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/my-feature');
  });

  test('should display page correctly', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'My Feature' }),
    ).toBeVisible();
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('my-feature-page'),
    );
  });
});

// Serial tests for mutations
test.describe.serial('My Feature - serial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/my-feature');
  });

  test('should create new item', async ({ page, database }) => {
    const cleanup = await database.isolate('before-create');

    // Perform mutation
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Name').fill('Test Item');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify
    await expect(page.getByText('Test Item')).toBeVisible();

    // Restore
    await cleanup();
  });
});
```

### Step 3: Recommended Patterns

**Waiting for elements:**

```typescript
// Prefer role-based selectors
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

// With timeout for slow-loading elements
await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
```

**Form interactions:**

```typescript
// Fill form fields
await page.getByPlaceholder('Enter name').fill('Test');
await page.getByRole('combobox').click();
await page.getByRole('option', { name: 'Option 1' }).click();
await page.getByRole('button', { name: 'Submit' }).click();
```

**Handling downloads:**

```typescript
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export' }).click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toMatch(/\.csv$/);
```

**Handling dialogs:**

```typescript
await page.getByRole('button', { name: 'Delete' }).click();
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();
await dialog.getByRole('button', { name: 'Confirm' }).click();
```

---

## Configuration Reference

### `playwright.config.ts`

Key settings:

```typescript
{
  testDir: './suites',
  fullyParallel: false,        // Controlled per-project
  forbidOnly: !!CI,            // Prevent .only in CI
  retries: CI ? 2 : 0,         // Retry failed tests in CI
  workers: CI ? 4 : undefined, // Parallel workers

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  }
}
```

### `test-config.ts`

```typescript
export const ADMIN_CREDENTIALS = {
  username: 'testadmin',
  password: 'TestAdmin123!',
};

export const TIMEOUTS = {
  containerStartup: 180000, // 3 minutes
  appInitialization: 10000, // 10 seconds
  navigationTimeout: 30000, // 30 seconds
};
```

---

## Debugging

### Playwright UI Mode

```bash
pnpm test:e2e:ui
```

### Debug Mode

```bash
pnpm test:e2e:debug
```

### Pause Before Tests (Container Inspection)

```bash
DEBUG_PAUSE=1 pnpm test:e2e
```

### View Test Reports

After tests run, open `tests/e2e/playwright-report/index.html`

### Check Context Resolution

```typescript
test('debug context', async ({ database }) => {
  const info = await database.getContextInfo();
  console.log(info);
  // { resolvedContext, availableContexts, detectionMethod, ... }
});
```

---

## CI/CD Integration

Tests run automatically via GitHub Actions on push/PR:

1. Builds Docker image with `DISABLE_IMAGE_OPTIMIZATION=true`
2. Sets `TEST_IMAGE_NAME=fresco:test`
3. Runs all E2E tests
4. Uploads HTML report (30-day retention)
5. Uploads videos on failure (7-day retention)

---

## Common Issues

### "No test environment context available"

**Cause:** Test file is in wrong directory or project name doesn't match.

**Fix:** Ensure test file is in correct suite directory and matches project `testMatch` pattern.

### Visual snapshot mismatch

**Cause:** Dynamic content, animations, or timing issues.

**Fix:**

- Use `SNAPSHOT_CONFIGS` with appropriate `waitTime`
- Add `mask` option for dynamic elements
- Run `--update-snapshots` to create new baseline

### Database state pollution

**Cause:** Test mutations not restored.

**Fix:**

- Always use `database.isolate()` for mutations
- Check for warnings in console about unrestored changes
- Ensure `cleanup()` is called

### Stale UI after database mutation

**Cause:** Next.js data cache not cleared.

**Fix:**

```typescript
await database.clearNextCache();
await page.reload();
```

---

## Best Practices

1. **Separate read/write tests** - Use `parallel` for reads, `serial` for mutations
2. **Always isolate mutations** - Use `database.isolate()` or `withSnapshot()`
3. **Use role-based selectors** - `getByRole()` is most accessible and stable
4. **Set appropriate timeouts** - Tables/modals may need longer waits
5. **Mask dynamic content** - Timestamps, user avatars, etc.
6. **Name snapshots descriptively** - `'participants-empty-state'` not `'test1'`
7. **Clear cache after mutations** - Call `database.clearNextCache()` when needed
