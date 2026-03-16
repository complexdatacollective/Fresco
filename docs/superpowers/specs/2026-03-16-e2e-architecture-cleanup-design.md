# E2E Architecture Cleanup

## Problem

Several architectural issues have accumulated in the e2e test system:

1. **Snapshot ownership is split.** `TestDatabase` creates snapshots during global-setup, but `DatabaseIsolation` restores them during tests. The same format (JSON files in `.db-snapshots/`) is read and written by two different classes with duplicated logic.

2. **`DatabaseIsolation` is a grab-bag.** It mixes snapshot management, preview-mode helpers, API token creation, and Prisma client exposure. Its name doesn't reflect what it actually is — the database fixture.

3. **App-state manipulation lives on the database fixture.** Methods like `enablePreviewMode()`, `createApiToken()`, and `createPreviewProtocol()` are app-level concerns that happen to use the database. They belong in their own fixture.

4. **`TestDatabase.restoreSnapshot()` is never called.** It duplicates `DatabaseIsolation.restoreSnapshot()` but with weaker error handling (no `lock_timeout`, no error-safe rollback). Only the `DatabaseIsolation` version is used by tests.

5. **`DatabaseIsolation.query()` is dead code.** Private method, never called.

6. **`getContext()` is duplicated** identically in `test.ts` and `api-test.ts`.

7. **`README.md` is stale.** Says 2 environments / 6 instances; actual is 4 / 12.

## Design

### `TestDatabase` becomes the database fixture

`TestDatabase` already owns container lifecycle (start/stop), migrations, and snapshot creation. It absorbs snapshot restoration from `DatabaseIsolation` and Prisma client exposure.

**What moves in:**
- `restoreSnapshot(name?)` from `DatabaseIsolation` (the `restoreWith` implementation with `session_replication_role`, lock timeout, and error-safe rollback)
- Prisma client creation and exposure (`prisma` field, created via `createTestPrisma()`)
- `suiteId` field (needed for snapshot path resolution)
- `getDatabaseUrl()` simple getter (returns `connectionUri`)

**What gets removed:**
- `restoreSnapshot(suiteId, name)` — the uncalled duplicate version, replaced by the more robust `DatabaseIsolation` implementation
- `createPool()` — inline pool creation into `createSnapshot()` and the new `restoreSnapshot()`, then delete this method

**Two construction paths:**

`TestDatabase` is used in two different contexts with different needs:

1. **Global-setup** — has a live container reference from `start()`. Calls `runMigrations()`, seeds, `createSnapshot()`, `stop()`.
2. **Test workers** — no container reference. Only has `connectionUri` from the context JSON. Needs snapshot restore and Prisma client.

To support both, add a second static factory:

```typescript
static fromConnectionUri(connectionUri: string, suiteId: string): TestDatabase
```

This creates a `TestDatabase` without a container reference, initializing only the `connectionUri`, `suiteId`, and Prisma client. The `stop()` method becomes a no-op (or throws) when there's no container. The fixture wiring in `test.ts` uses this factory:

```typescript
database: [async ({}, use, workerInfo) => {
  const context = await getContext(suiteId);
  const db = TestDatabase.fromConnectionUri(context.databaseUrl, suiteId);
  await use(db);
}, { scope: 'worker' }],
```

**Full lifecycle:**
- `TestDatabase.start()` — global-setup: creates container, returns instance with container reference
- `TestDatabase.fromConnectionUri(url, suiteId)` — test workers: creates lightweight instance with Prisma client, no container
- `runMigrations()` — global-setup only
- `createSnapshot(name)` — global-setup only. Uses `this.suiteId` (set via `setSuiteId(id)` or passed to a setup-phase method). Creates a local pg pool internally.
- `restoreSnapshot(name?)` — test workers. Uses the robust implementation from `DatabaseIsolation` (lock timeout, error-safe rollback). Creates a local pg pool internally.
- `stop()` — global-teardown only. Stops the container. No-op if no container reference.

**Exposed to tests via fixture:**
- `database.restoreSnapshot(name?)` — restore DB to snapshot state
- `database.prisma` — the Prisma client for direct queries
- `database.connectionUri` — raw connection string (already public)

Tests can do `database.prisma.interview.count()` directly instead of `database.getInterviewCount()`.

### `DatabaseIsolation` is deleted

All its responsibilities are absorbed:
- Snapshot restore → `TestDatabase`
- Prisma client → `TestDatabase`
- Preview-mode methods → new `app` fixture
- `getInterviewCount()` → replaced by direct `database.prisma.interview.count()` in tests
- `getDatabaseUrl()` → `database.connectionUri` (already public)
- Dead `query()` method → deleted

### New `app` fixture (`fixtures/app-fixture.ts`)

A thin fixture for manipulating app-level state. Takes the Prisma client from the database fixture.

**Public API:**
- `setSetting(key, value)` — upsert an `AppSettings` row
- `getSetting(key)` — read an `AppSettings` row
- `createApiToken(description)` — create an API token, return the token string

This is general-purpose — it doesn't know about "preview mode". Enabling preview mode is just:
```typescript
await app.setSetting('previewMode', 'true');
await app.setSetting('previewModeRequireAuth', 'false');
```

**Fixture wiring:** Worker-scoped in `test.ts` and `api-test.ts`, depends on `database` fixture.

### Preview protocol helpers become local to specs

`createPreviewProtocol()` moves out of the database fixture into `helpers/preview-protocol.ts` as a standalone function that accepts a Prisma client:

```typescript
const protocolId = await createPreviewProtocol(database.prisma);
```

This keeps `helpers/preview-protocol.ts` as the single home for all preview protocol test utilities — both the JSON factories (`createTestProtocol`, `INVALID_PROTOCOL`) and the DB operation (`createPreviewProtocol`).

`deletePreviewProtocol()` and `createPreviewProtocolFromJson()` have zero callers — they are dead code and should be deleted, not moved.

### `getContext()` extracted to `helpers/context.ts`

The duplicated `getContext()` function and `contextCache` variable move to `helpers/context.ts`, alongside the existing `loadContext`/`saveContext` exports. Both `test.ts` and `api-test.ts` import it.

### `README.md` updated

Fix "3 browsers x 2 environments = 6 instances" → "3 browsers x 4 environments = 12 instances". Add `api` and `interview` rows to the environments table.

## Changes by file

**Create: `fixtures/app-fixture.ts`**
- `AppFixture` class with `setSetting()`, `getSetting()`, `createApiToken()`

**Modify: `helpers/TestDatabase.ts`**
- Absorb snapshot restore logic from `DatabaseIsolation`
- Add Prisma client creation and `prisma` field
- Add `suiteId` field and `initForTests()` method
- Remove dead `restoreSnapshot()` and `createPool()`

**Modify: `helpers/preview-protocol.ts`**
- Add `createPreviewProtocol()` as a function taking a Prisma client as first argument

**Delete: `fixtures/db-fixture.ts`**
- Entire file — all responsibilities absorbed elsewhere

**Modify: `fixtures/test.ts`**
- Database fixture now instantiates `TestDatabase` (loaded from context) instead of `DatabaseIsolation`
- Add `app` worker-scoped fixture
- Import `getContext` from `helpers/context.ts` instead of defining locally
- Remove local `contextCache` and `getContext`

**Modify: `fixtures/api-test.ts`**
- Same changes as `test.ts` (database + app fixtures, shared getContext)

**Modify: `fixtures/interview-test.ts`**
- `ProtocolFixture` constructor changes from `database.getPrisma()` to `database.prisma`

**Modify: `fixtures/protocol-fixture.ts`**
- No changes needed — already accepts `TestPrismaClient` in constructor

**Modify: `specs/api/preview-mode.spec.ts`**
- Replace `database.enablePreviewMode(true)` with `app.setSetting('previewMode', 'true')` + `app.setSetting('previewModeRequireAuth', 'true')`
- Replace `database.createApiToken(...)` with `app.createApiToken(...)`
- Destructure `app` from test fixtures

**Modify: `specs/interview/preview-mode.spec.ts`**
- Replace `database.enablePreviewMode(...)` with `app.setSetting('previewMode', 'true')` + `app.setSetting('previewModeRequireAuth', ...)`
- Replace `database.disablePreviewMode()` with `app.setSetting('previewMode', 'false')`
- Replace `database.createPreviewProtocol(...)` with `createPreviewProtocol(database.prisma, ...)`
- Replace `database.getInterviewCount()` with `database.prisma.interview.count()`
- Import `createPreviewProtocol` from `helpers/preview-protocol.js`
- Destructure `app` from test fixtures

**Modify: `specs/setup/onboarding.spec.ts`**
- No changes — only uses `database.restoreSnapshot()` which stays

**Modify: `specs/interview/silos/interview.spec.ts`**
- No changes — only uses `database.restoreSnapshot()` and `protocol` fixture

**Modify: `global-setup.ts`**
- Call `db.setSuiteId(suiteId)` before `db.createSnapshot('initial')` (since `createSnapshot` now uses `this.suiteId` instead of taking it as a parameter)
- Or adjust `startEnvironment()` to pass `suiteId` to `TestDatabase` after construction

**Modify: `global-teardown.ts`**
- No changes — already just calls `db.stop()` and `server.stop()`

**Modify: `helpers/context.ts`**
- Add exported `getContext()` function with `contextCache`

**Modify: `tests/e2e/README.md`**
- Fix environment count and table

**Modify: `tests/e2e/CLAUDE.md`**
- Update database fixture docs (now TestDatabase)
- Add app fixture docs
- Remove DatabaseIsolation references
- Update file structure listing

## Fixture availability by environment

| Fixture | setup | dashboard | api | interview |
|---------|-------|-----------|-----|-----------|
| `database` | yes | yes | yes | yes |
| `app` | yes | yes | yes | yes |
| `protocol` | no | no | no | yes |
| `interview` | no | no | no | yes |
| `stage` | no | no | no | yes |

## Test access after refactor

```typescript
// Any test — snapshot restore
test('mutates data', async ({ database }) => {
  await database.restoreSnapshot();
});

// Any test — direct Prisma query
test('checks count', async ({ database }) => {
  const count = await database.prisma.interview.count();
});

// Preview API test — app state + API token
test('auth required', async ({ request, database, app }) => {
  await database.restoreSnapshot();
  await app.setSetting('previewMode', 'true');
  await app.setSetting('previewModeRequireAuth', 'true');
  const token = await app.createApiToken('test-token');
  // ... API call with token
});

// Preview browser test — app state + preview protocol
import { createPreviewProtocol } from '../../helpers/preview-protocol.js';

test('preview renders', async ({ page, database, app }) => {
  await database.restoreSnapshot();
  await app.setSetting('previewMode', 'true');
  const protocolId = await createPreviewProtocol(database.prisma);
  await page.goto(`/preview/${protocolId}`);
});
```
