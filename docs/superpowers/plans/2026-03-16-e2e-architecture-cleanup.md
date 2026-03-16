# E2E Architecture Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the e2e database layer by making `TestDatabase` the single database fixture, creating an `AppFixture` for app-state manipulation, and eliminating `DatabaseIsolation`.

**Architecture:** `TestDatabase` gains a second factory (`fromConnectionUri`) for test workers, absorbs snapshot restore and Prisma client from `DatabaseIsolation`. A new `AppFixture` handles app settings and API tokens. Preview protocol DB helpers move to `helpers/preview-protocol.ts`. `DatabaseIsolation` is deleted.

**Tech Stack:** Playwright fixtures, Prisma ORM, raw `pg` (for snapshot transactions), testcontainers

**Spec:** `docs/superpowers/specs/2026-03-16-e2e-architecture-cleanup-design.md`

---

## Chunk 1: Infrastructure — TestDatabase, getContext, AppFixture

### Task 1: Extract `getContext()` to `helpers/context.ts`

**Files:**
- Modify: `tests/e2e/helpers/context.ts`
- Reference: `tests/e2e/fixtures/test.ts` (lines 70-90, source of duplicated code)

- [ ] **Step 1: Add `getContext()` and `getContextMappings` import to context.ts**

Read `tests/e2e/helpers/context.ts` and `tests/e2e/fixtures/test.ts`. Add the `getContext()` function and `contextCache` variable to `context.ts`. The function loads context from the JSON file (via `loadContext()`) and returns the `SuiteContext` for a given `suiteId`. It caches the loaded context in a module-level variable.

```typescript
import { getContextMappings } from '../config/test-config.js';

let contextCache: Record<string, SuiteContext> | null = null;

export async function getContext(suiteId: string): Promise<SuiteContext> {
  if (!contextCache) {
    const stored = await loadContext();
    if (!stored) {
      throw new Error(
        'Test context not found. Did global-setup.ts run successfully?',
      );
    }
    contextCache = stored.suites;
  }

  const suite = contextCache[suiteId];
  if (!suite) {
    throw new Error(
      `Suite "${suiteId}" not found in test context. Available: ${Object.keys(contextCache).join(', ')}`,
    );
  }
  return suite;
}
```

Also add a helper to resolve suiteId from workerInfo, since this logic is also duplicated:

```typescript
export function getSuiteId(projectName: string): string {
  const mappings = getContextMappings();
  const suiteId = mappings[projectName];
  if (!suiteId) {
    throw new Error(
      `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
    );
  }
  return suiteId;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/helpers/context.ts
git add tests/e2e/helpers/context.ts
git commit -m "feat(e2e): extract getContext and getSuiteId to helpers/context

Eliminates duplication between test.ts and api-test.ts."
```

### Task 2: Restructure `TestDatabase`

**Files:**
- Modify: `tests/e2e/helpers/TestDatabase.ts`
- Reference: `tests/e2e/fixtures/db-fixture.ts` (source of snapshot restore logic and Prisma client)

This is the core task. `TestDatabase` gains:
- A second static factory `fromConnectionUri(url, suiteId)` for test workers
- Snapshot restore (from `DatabaseIsolation.restoreWith`)
- Prisma client field
- `suiteId` field

And loses:
- The old uncalled `restoreSnapshot(suiteId, name)` method
- `createPool()` (inlined into snapshot methods)

- [ ] **Step 1: Read both files**

Read `tests/e2e/helpers/TestDatabase.ts` and `tests/e2e/fixtures/db-fixture.ts` fully.

- [ ] **Step 2: Add imports**

Add to the top of `TestDatabase.ts`:
```typescript
import { createTestPrisma, type TestPrismaClient } from './prisma.js';
```

- [ ] **Step 3: Add `suiteId` and `prisma` fields, update constructor**

Change the private constructor to accept optional `suiteId` and make `container` optional:

```typescript
export class TestDatabase {
  container: StartedPostgreSqlContainer | null;
  connectionUri: string;
  suiteId: string;
  prisma: TestPrismaClient;

  private constructor(
    connectionUri: string,
    suiteId: string,
    container: StartedPostgreSqlContainer | null,
  ) {
    this.container = container;
    this.connectionUri = connectionUri;
    this.suiteId = suiteId;
    this.prisma = createTestPrisma(connectionUri);
  }
```

- [ ] **Step 4: Update `start()` factory**

`start()` doesn't know the suiteId yet during global-setup. Pass an empty string and let global-setup set it later:

```typescript
static async start(): Promise<TestDatabase> {
  log('setup', 'Starting PostgreSQL container...');
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('fresco_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const connectionUri = container.getConnectionUri();
  log('setup', `PostgreSQL started at ${connectionUri}`);
  return new TestDatabase(connectionUri, '', container);
}
```

- [ ] **Step 5: Add `fromConnectionUri()` factory**

```typescript
static fromConnectionUri(connectionUri: string, suiteId: string): TestDatabase {
  return new TestDatabase(connectionUri, suiteId, null);
}
```

- [ ] **Step 6: Replace `createSnapshot` — inline pool, use `this.suiteId`**

Replace the existing `createSnapshot` method. Drop the `suiteId` parameter (use `this.suiteId`), inline pool creation:

```typescript
async createSnapshot(name: string): Promise<void> {
  log('setup', `Creating snapshot "${name}" for suite "${this.suiteId}"...`);
  const pool = new pg.Pool({ connectionString: this.connectionUri, max: 5 });

  try {
    // ... (keep existing body unchanged — query tables, build snapshot array, write JSON)
  } finally {
    await pool.end();
  }
}
```

Keep the body logic identical, but make two changes: (1) replace `this.createPool()` with the inline `new pg.Pool(...)`, and (2) replace all references to the `suiteId` parameter variable with `this.suiteId` (appears in the snapshot directory path and log message).

- [ ] **Step 7: Replace `restoreSnapshot` with `DatabaseIsolation` version**

Delete the old `restoreSnapshot(suiteId, name)`. Add the robust version from `DatabaseIsolation`:

```typescript
async restoreSnapshot(name = 'initial'): Promise<void> {
  const pool = new pg.Pool({
    connectionString: this.connectionUri,
    max: 1,
  });
  const client = await pool.connect();

  try {
    log('test', `Restoring snapshot "${name}" for suite "${this.suiteId}"...`);

    const snapshotFile = path.join(SNAPSHOTS_DIR, this.suiteId, `${name}.json`);
    const data = await fs.readFile(snapshotFile, 'utf-8');
    const snapshot = JSON.parse(data) as TableSnapshot[];

    await client.query('SET lock_timeout = 5000');
    try {
      await client.query('BEGIN');
      await client.query('SET session_replication_role = replica');

      for (const { table } of snapshot) {
        await client.query(`TRUNCATE "${table}" CASCADE`);
      }

      for (const { table, rows } of snapshot) {
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row).map((v) =>
            v !== null && typeof v === 'object' && !(v instanceof Date)
              ? JSON.stringify(v)
              : v,
          );
          const placeholders = columns.map((_, i) => `$${i + 1}`);
          await client.query(
            `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
            values,
          );
        }
      }

      await client.query('SET session_replication_role = DEFAULT');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {
        // Ignore rollback errors
      });
      throw error;
    } finally {
      await client.query('SET lock_timeout = 0');
    }
  } finally {
    client.release();
    await pool.end();
  }
}
```

- [ ] **Step 8: Delete `createPool()` method**

Remove the `createPool()` method entirely.

- [ ] **Step 9: Update `stop()` to handle null container**

```typescript
async stop(): Promise<void> {
  if (!this.container) return;
  log('teardown', 'Stopping PostgreSQL container...');
  try {
    await this.container.stop();
    log('teardown', 'PostgreSQL container stopped');
  } catch (error) {
    logError('teardown', 'Failed to stop PostgreSQL container', error);
  }
}
```

- [ ] **Step 10: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 11: Format and commit**

```bash
pnpm prettier --write tests/e2e/helpers/TestDatabase.ts
git add tests/e2e/helpers/TestDatabase.ts
git commit -m "feat(e2e): restructure TestDatabase as unified database fixture

Adds fromConnectionUri() factory for test workers, absorbs snapshot
restore from DatabaseIsolation with lock_timeout and error-safe
rollback, adds Prisma client field."
```

### Task 3: Update `global-setup.ts` for new TestDatabase API

**Files:**
- Modify: `tests/e2e/global-setup.ts`

- [ ] **Step 1: Set suiteId before createSnapshot**

In the `startEnvironment()` function, after `TestDatabase.start()` and before `db.createSnapshot()`, set the suiteId:

Change:
```typescript
await db.createSnapshot(suiteId, 'initial');
```
To:
```typescript
db.suiteId = suiteId;
await db.createSnapshot('initial');
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/global-setup.ts
git add tests/e2e/global-setup.ts
git commit -m "refactor(e2e): update global-setup for new TestDatabase API

Set suiteId on instance before createSnapshot, which now uses
this.suiteId instead of a parameter."
```

### Task 4: Create `AppFixture`

**Files:**
- Create: `tests/e2e/fixtures/app-fixture.ts`
- Reference: `tests/e2e/fixtures/db-fixture.ts` (source of `enablePreviewMode`, `createApiToken`)

- [ ] **Step 1: Create the AppFixture class**

```typescript
import { createId } from '@paralleldrive/cuid2';
import { randomBytes } from 'node:crypto';
import { type TestPrismaClient } from '../helpers/prisma.js';
import { log } from '../helpers/logger.js';

export class AppFixture {
  private prisma: TestPrismaClient;

  constructor(prisma: TestPrismaClient) {
    this.prisma = prisma;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.prisma.appSettings.upsert({
      where: { key: key as Parameters<typeof this.prisma.appSettings.upsert>[0]['where']['key'] },
      create: { key: key as Parameters<typeof this.prisma.appSettings.upsert>[0]['create']['key'], value },
      update: { value },
    });
    log('test', `Set app setting "${key}" = "${value}"`);
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.appSettings.findUnique({
      where: { key: key as Parameters<typeof this.prisma.appSettings.findUnique>[0]['where']['key'] },
    });
    return setting?.value ?? null;
  }

  async createApiToken(description: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    await this.prisma.apiToken.create({
      data: {
        id: createId(),
        token,
        description,
        isActive: true,
      },
    });

    log('test', `Created API token "${description}"`);
    return token;
  }
}
```

Note: The `key` parameter typing for `AppSettings` uses the `AppSetting` enum from the Prisma schema. The implementer should check the exact type and cast appropriately, or use the `AppSetting` enum type directly from Prisma if available. Read `db-fixture.ts` to see how the existing code handles this — the current `enablePreviewMode` passes string literals like `'previewMode'` directly.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
If there are type errors with the `AppSetting` enum, import it from `~/lib/db/generated/client` and use it to type the `key` parameter properly.

- [ ] **Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/fixtures/app-fixture.ts
git add tests/e2e/fixtures/app-fixture.ts
git commit -m "feat(e2e): create AppFixture for app-level state manipulation

Provides setSetting(), getSetting(), and createApiToken() for
tests that need to manipulate app configuration."
```

### Task 5: Move `createPreviewProtocol` to `helpers/preview-protocol.ts`

**Files:**
- Modify: `tests/e2e/helpers/preview-protocol.ts`
- Reference: `tests/e2e/fixtures/db-fixture.ts` (source of `createPreviewProtocol`)

- [ ] **Step 1: Read both files**

Read `tests/e2e/helpers/preview-protocol.ts` and the `createPreviewProtocol` method in `tests/e2e/fixtures/db-fixture.ts` (around line 138-214).

- [ ] **Step 2: Add the function to preview-protocol.ts**

Add `createPreviewProtocol` as a standalone function that takes a Prisma client as its first argument. Port the logic from `DatabaseIsolation.createPreviewProtocol()`:

```typescript
import { type Prisma } from '~/lib/db/generated/client';
import { type TestPrismaClient } from './prisma.js';
import { hash } from 'ohash';

export async function createPreviewProtocol(
  prisma: TestPrismaClient,
  options?: { isPending?: boolean; name?: string },
): Promise<string> {
  // ... (copy the body from DatabaseIsolation.createPreviewProtocol)
  // Replace `this.prisma` with `prisma`
  // Return protocolId
}
```

Copy the full method body from `db-fixture.ts`, replacing `this.prisma` references with the `prisma` parameter. Add needed imports (`createId` from `@paralleldrive/cuid2`, `hash` from `ohash`).

**Important:** Do NOT move `deletePreviewProtocol()` or `createPreviewProtocolFromJson()` — they have zero callers and are dead code. They will be deleted when `db-fixture.ts` is removed in Task 11.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 4: Format and commit**

```bash
pnpm prettier --write tests/e2e/helpers/preview-protocol.ts
git add tests/e2e/helpers/preview-protocol.ts
git commit -m "feat(e2e): add createPreviewProtocol to preview-protocol helper

Standalone function accepting a Prisma client, moved from
DatabaseIsolation.createPreviewProtocol()."
```

## Chunk 2: Fixture wiring — connect new infrastructure to tests

### Task 6: Update `fixtures/test.ts` to use TestDatabase and AppFixture

**Files:**
- Modify: `tests/e2e/fixtures/test.ts`

- [ ] **Step 1: Read current file**

Read `tests/e2e/fixtures/test.ts` fully.

- [ ] **Step 2: Replace imports**

Remove:
```typescript
import { DatabaseIsolation } from './db-fixture.js';
```

Add:
```typescript
import { TestDatabase } from '../helpers/TestDatabase.js';
import { AppFixture } from './app-fixture.js';
import { getContext, getSuiteId } from '../helpers/context.js';
```

Keep the `getContextMappings` import removal — it's now used inside `getSuiteId()` in `context.ts`.

- [ ] **Step 3: Remove local `contextCache` and `getContext`**

Delete the `let contextCache` variable and the entire `async function getContext()` function (lines ~70-90).

- [ ] **Step 4: Update `WorkerFixtures` type**

Change:
```typescript
type WorkerFixtures = {
  database: DatabaseIsolation;
};
```
To:
```typescript
type WorkerFixtures = {
  database: TestDatabase;
  app: AppFixture;
};
```

- [ ] **Step 5: Update database fixture wiring**

Replace the `database` fixture definition:
```typescript
database: [
  // eslint-disable-next-line no-empty-pattern
  async ({}, use, workerInfo) => {
    const projectName = workerInfo.project.name;
    const suiteId = getSuiteId(projectName);
    const context = await getContext(suiteId);
    const db = TestDatabase.fromConnectionUri(context.databaseUrl, suiteId);

    await use(db);
  },
  { scope: 'worker' },
],
```

- [ ] **Step 6: Add app fixture wiring**

Add the `app` fixture after `database`:
```typescript
app: [
  async ({ database }, use) => {
    const app = new AppFixture(database.prisma);
    await use(app);
  },
  { scope: 'worker' },
],
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: Errors in spec files that still reference `DatabaseIsolation` methods — that's fine, we'll fix those in Chunk 3.

- [ ] **Step 8: Format and commit**

```bash
pnpm prettier --write tests/e2e/fixtures/test.ts
git add tests/e2e/fixtures/test.ts
git commit -m "refactor(e2e): wire TestDatabase and AppFixture in test.ts

Database fixture now uses TestDatabase.fromConnectionUri().
App fixture provides setSetting/createApiToken.
getContext imported from helpers/context.ts."
```

### Task 7: Update `fixtures/api-test.ts`

**Files:**
- Modify: `tests/e2e/fixtures/api-test.ts`

- [ ] **Step 1: Read current file and apply same changes as test.ts**

The changes mirror Task 6:
- Replace `DatabaseIsolation` import with `TestDatabase` and `AppFixture`
- Import `getContext`, `getSuiteId` from `helpers/context.ts`
- Remove local `contextCache` and `getContext` function
- Update `WorkerFixtures` type to include `app: AppFixture`
- Update database fixture to use `TestDatabase.fromConnectionUri()`
- Add app fixture wiring

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/fixtures/api-test.ts
git add tests/e2e/fixtures/api-test.ts
git commit -m "refactor(e2e): wire TestDatabase and AppFixture in api-test.ts

Same changes as test.ts — shared getContext, TestDatabase fixture,
AppFixture for app-state."
```

### Task 8: Update `fixtures/interview-test.ts`

**Files:**
- Modify: `tests/e2e/fixtures/interview-test.ts`

- [ ] **Step 1: Update ProtocolFixture instantiation**

Change:
```typescript
const protocol = new ProtocolFixture(database.getPrisma());
```
To:
```typescript
const protocol = new ProtocolFixture(database.prisma);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/fixtures/interview-test.ts
git add tests/e2e/fixtures/interview-test.ts
git commit -m "refactor(e2e): use database.prisma in interview-test

Replaces database.getPrisma() with direct prisma field access."
```

## Chunk 3: Spec migration and DatabaseIsolation deletion

### Task 9: Update `specs/api/preview-mode.spec.ts`

**Files:**
- Modify: `tests/e2e/specs/api/preview-mode.spec.ts`

- [ ] **Step 1: Read the file**

Read `tests/e2e/specs/api/preview-mode.spec.ts` fully.

- [ ] **Step 2: Add `app` to all test destructures that use it**

Every test that calls `database.enablePreviewMode()` or `database.createApiToken()` needs to destructure `app` from the fixtures.

- [ ] **Step 3: Replace all `database.enablePreviewMode(true)` calls**

Replace with:
```typescript
await app.setSetting('previewMode', 'true');
await app.setSetting('previewModeRequireAuth', 'true');
```

For `database.enablePreviewMode(false)`:
```typescript
await app.setSetting('previewMode', 'true');
await app.setSetting('previewModeRequireAuth', 'false');
```

- [ ] **Step 4: Replace `database.createApiToken(...)` calls**

Replace with `app.createApiToken(...)`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 6: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/api/preview-mode.spec.ts
git add tests/e2e/specs/api/preview-mode.spec.ts
git commit -m "refactor(e2e): use app fixture in API preview-mode spec

Replaces database.enablePreviewMode/createApiToken with
app.setSetting/createApiToken."
```

### Task 10: Update `specs/interview/preview-mode.spec.ts`

**Files:**
- Modify: `tests/e2e/specs/interview/preview-mode.spec.ts`

- [ ] **Step 1: Read the file**

Read `tests/e2e/specs/interview/preview-mode.spec.ts` fully.

- [ ] **Step 2: Add imports**

Add:
```typescript
import { createPreviewProtocol } from '../../helpers/preview-protocol.js';
```

- [ ] **Step 3: Add `app` to all test destructures that use it**

- [ ] **Step 4: Replace all `database.enablePreviewMode(...)` calls**

Same pattern as Task 9.

- [ ] **Step 5: Replace `database.disablePreviewMode()` call**

Replace with:
```typescript
await app.setSetting('previewMode', 'false');
```

- [ ] **Step 6: Replace `database.createPreviewProtocol(...)` calls**

Replace with `createPreviewProtocol(database.prisma, ...)`. Note: the options parameter stays the same (`{ isPending: true }`, etc.).

- [ ] **Step 7: Replace `database.getInterviewCount()` calls**

Replace with `database.prisma.interview.count()`.

- [ ] **Step 8: Verify TypeScript compiles**

Run: `pnpm typecheck`

- [ ] **Step 9: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/interview/preview-mode.spec.ts
git add tests/e2e/specs/interview/preview-mode.spec.ts
git commit -m "refactor(e2e): use app fixture and preview helpers in interview preview spec

Replaces database preview methods with app.setSetting,
createPreviewProtocol helper, and direct Prisma queries."
```

### Task 11: Delete `fixtures/db-fixture.ts`

**Files:**
- Delete: `tests/e2e/fixtures/db-fixture.ts`

- [ ] **Step 1: Verify no remaining imports**

Search for any remaining imports of `db-fixture`:
```bash
grep -r "db-fixture" tests/e2e/
```
Expected: No results (all consumers have been migrated).

- [ ] **Step 2: Delete the file**

```bash
rm tests/e2e/fixtures/db-fixture.ts
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: Clean compile — all consumers now use `TestDatabase` and `AppFixture`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fixtures/db-fixture.ts
git commit -m "remove(e2e): delete DatabaseIsolation (db-fixture.ts)

All responsibilities absorbed: snapshots → TestDatabase,
app state → AppFixture, preview protocols → helpers/preview-protocol,
Prisma client → TestDatabase.prisma."
```

## Chunk 4: Documentation and cleanup

### Task 12: Update `tests/e2e/README.md`

**Files:**
- Modify: `tests/e2e/README.md`

- [ ] **Step 1: Fix environment count**

Change line 31:
```
Each test run spins up **3 browsers x 2 environments = 6 isolated instances**:
```
To:
```
Each test run spins up **3 browsers x 4 environments = 12 isolated instances**:
```

Update the counts on lines 33-34:
```
- 12 PostgreSQL containers via testcontainers
- 12 standalone Next.js server processes
```

- [ ] **Step 2: Update environments table**

Add `api` and `interview` rows:

```markdown
| Environment | Purpose               | Seed State                                          |
| ----------- | --------------------- | --------------------------------------------------- |
| setup       | Onboarding wizard     | Unconfigured app (fresh install)                    |
| dashboard   | Dashboard pages       | Admin user, protocol, 10 participants, 5 interviews |
| api         | API-only tests        | Same as dashboard (no auth)                         |
| interview   | Interview/preview     | Same as dashboard (no auth)                         |
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/README.md
git commit -m "docs(e2e): fix README environment count and table

Was 2 environments / 6 instances, now correctly shows
4 environments / 12 instances."
```

### Task 13: Update `tests/e2e/CLAUDE.md`

**Files:**
- Modify: `tests/e2e/CLAUDE.md`

- [ ] **Step 1: Update file structure listing**

In the helpers section, remove `protocol-installer.ts` (already gone) if still listed. Ensure `preview-protocol.ts` is in helpers.

In the fixtures section, update to:
```
├── fixtures/
│   ├── test.ts                  # Extended test with database + app fixtures (browser tests)
│   ├── api-test.ts              # Extended test for API-only tests
│   ├── app-fixture.ts           # App-level state fixture (settings, API tokens)
│   ├── interview-test.ts        # Interview fixtures (interview, stage, protocol)
│   ├── interview-fixture.ts     # Interview page object model
│   ├── stage-fixture.ts         # Stage interaction fixture
│   └── protocol-fixture.ts      # Protocol installation fixture
```

Note: `db-fixture.ts` is removed from the listing.

- [ ] **Step 2: Update database fixture methods section**

Replace the database fixture methods documentation. The database fixture is now `TestDatabase`:

```markdown
### Database fixture methods

The `database` fixture provides database access and snapshot management. Available in all tests.

- `database.restoreSnapshot(name?)` — Restore database to initial seeded state. Call at the start of any test that mutates data.
- `database.prisma` — Prisma client for direct database queries (e.g., `database.prisma.interview.count()`).
- `database.connectionUri` — Raw PostgreSQL connection string (rarely needed).
```

- [ ] **Step 3: Add app fixture documentation**

Add after database fixture methods:

```markdown
### App fixture methods

The `app` fixture provides app-level state manipulation. Available in all tests.

- `app.setSetting(key, value)` — Upsert an AppSettings row.
- `app.getSetting(key)` — Read an AppSettings value (returns null if not set).
- `app.createApiToken(description)` — Create an API token, returns the token string.
```

- [ ] **Step 4: Update any remaining DatabaseIsolation references**

Search the file for `DatabaseIsolation` and replace/remove. Update any examples that reference `db-fixture.ts`.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/CLAUDE.md
git commit -m "docs(e2e): update CLAUDE.md for architecture cleanup

Removes DatabaseIsolation references, documents TestDatabase as
database fixture, adds app fixture docs, updates file structure."
```

### Task 14: Format, lint, and typecheck

- [ ] **Step 1: Run formatter on all changed files**

```bash
pnpm prettier --write tests/e2e/helpers/TestDatabase.ts tests/e2e/helpers/context.ts tests/e2e/helpers/preview-protocol.ts tests/e2e/fixtures/test.ts tests/e2e/fixtures/api-test.ts tests/e2e/fixtures/interview-test.ts tests/e2e/fixtures/app-fixture.ts tests/e2e/specs/api/preview-mode.spec.ts tests/e2e/specs/interview/preview-mode.spec.ts tests/e2e/global-setup.ts
```

- [ ] **Step 2: Run linter with autofix**

```bash
pnpm lint --fix
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: All pass with no errors.

- [ ] **Step 4: Commit any formatting changes**

If there are changes:
```bash
git add -u
git commit -m "style(e2e): format architecture cleanup files"
```
