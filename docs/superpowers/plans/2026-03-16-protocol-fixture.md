# Protocol Fixture Extraction — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract protocol installation from `DatabaseIsolation` into a dedicated `ProtocolFixture` with automatic Playwright lifecycle management.

**Architecture:** Move all logic from `helpers/protocol-installer.ts` into a new `fixtures/protocol-fixture.ts` class. Wire it as a worker-scoped fixture in `interview-test.ts`. Remove protocol proxy methods from `DatabaseIsolation` and delete the helper file.

**Tech Stack:** Playwright fixtures, raw `pg` SQL, `jszip`, `@codaco/protocol-validation` types

**Spec:** `docs/superpowers/specs/2026-03-16-protocol-fixture-design.md`

---

## Chunk 1: Create ProtocolFixture and wire it up

### Task 1: Create `fixtures/protocol-fixture.ts`

**Files:**
- Create: `tests/e2e/fixtures/protocol-fixture.ts`
- Reference: `tests/e2e/helpers/protocol-installer.ts` (source of logic to absorb)

- [ ] **Step 1: Create the file with the full class**

Move all logic from `helpers/protocol-installer.ts` into a new `ProtocolFixture` class. Key differences from the old `ProtocolInstaller`:

- Constructor takes only `databaseUrl` (not `publicDir`). Derive `publicDir` internally:
  ```typescript
  const projectRoot = path.resolve(import.meta.dirname, '../../../');
  this.publicDir = path.join(projectRoot, '.next/standalone/public');
  ```
- Class name is `ProtocolFixture` (not `ProtocolInstaller`)
- The standalone `cleanupExtractedAssets()` export is NOT needed — its logic is covered by `cleanup()`
- The `createInitialNetwork()` helper function moves into this file (it was private to `protocol-installer.ts`)
- All public methods, private methods, and the `InstalledProtocol` type transfer as-is

The full public API:
- `install(protocolPath): Promise<InstalledProtocol>`
- `createInterview(protocolId, participantIdentifier?): Promise<string>`
- `injectNetworkState(interviewId, network, currentStep): Promise<void>`
- `uninstall(protocolId): Promise<void>`
- `cleanup(): Promise<void>`
- `getInstalledProtocols(): string[]`

Private methods:
- `extractAssets(zip, assetDir): Promise<void>`
- `rewriteAssetUrls(protocol, protocolId): VersionedProtocol`
- `insertProtocol(protocolId, protocol): Promise<void>`

Export the `InstalledProtocol` type from this file.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No new errors in `protocol-fixture.ts`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/fixtures/protocol-fixture.ts
git commit -m "feat(e2e): create ProtocolFixture class

Absorbs all protocol installation logic from the ProtocolInstaller
helper into a dedicated fixture class with self-contained path
derivation."
```

### Task 2: Wire `protocol` fixture into `interview-test.ts`

**Files:**
- Modify: `tests/e2e/fixtures/interview-test.ts`

- [ ] **Step 1: Add the worker-scoped `protocol` fixture**

Import `ProtocolFixture` from `./protocol-fixture.js`.

Add a new `InterviewWorkerFixtures` type:
```typescript
type InterviewWorkerFixtures = {
  protocol: ProtocolFixture;
};
```

Change `baseTest.extend<InterviewTestFixtures>` to `baseTest.extend<InterviewTestFixtures, InterviewWorkerFixtures>`.

Add the `protocol` fixture definition:
```typescript
protocol: [
  // eslint-disable-next-line no-empty-pattern
  async ({ database }, use) => {
    const protocol = new ProtocolFixture(database.getDatabaseUrl());
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(protocol);
    await protocol.cleanup();
  },
  { scope: 'worker' },
],
```

- [ ] **Step 2: Update the JSDoc header**

Replace the usage example in the file header comment (lines 18-21) to use the new API:
```typescript
 *   test.beforeAll(async ({ database, protocol }) => {
 *     const { protocolId } = await protocol.install(PROTOCOL_PATH);
 *     interviewId = await protocol.createInterview(protocolId);
 *   });
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fixtures/interview-test.ts
git commit -m "feat(e2e): wire protocol fixture into interview-test

Adds worker-scoped protocol fixture with automatic cleanup via
Playwright fixture teardown."
```

### Task 3: Update `specs/interview/silos/interview.spec.ts`

**Files:**
- Modify: `tests/e2e/specs/interview/silos/interview.spec.ts`

- [ ] **Step 1: Update imports and fixture usage**

Change:
```typescript
import { type InstalledProtocol } from '~/tests/e2e/fixtures/db-fixture.js';
```
To:
```typescript
import { type InstalledProtocol } from '~/tests/e2e/fixtures/protocol-fixture.js';
```

Update `test.beforeAll` to destructure `protocol` and use it:
```typescript
test.beforeAll(async ({ database, protocol }) => {
  await database.restoreSnapshot();
  installedProtocol = await protocol.install(SILOS_PROTOCOL_PATH);
  interviewId = await protocol.createInterview(installedProtocol.protocolId);
});
```

Remove the `test.afterAll` block entirely — fixture teardown handles cleanup.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/specs/interview/silos/interview.spec.ts
git commit -m "refactor(e2e): use protocol fixture in SILOS spec

Replaces database.installProtocolFromFile() with protocol.install().
Removes manual afterAll cleanup — fixture teardown handles it."
```

## Chunk 2: Remove old code and update docs

### Task 4: Remove protocol code from `DatabaseIsolation`

**Files:**
- Modify: `tests/e2e/fixtures/db-fixture.ts`

- [ ] **Step 1: Remove protocol-related imports**

Remove the import of `ProtocolInstaller` and `InstalledProtocol` from `../helpers/protocol-installer.js`.

Keep the `import path from 'node:path'` — it is still used by snapshot file resolution in `restoreWith()`.

Remove the re-export: `export type { InstalledProtocol };` (line 372).

- [ ] **Step 2: Remove the protocol section**

Delete everything from the `// Protocol Installation Helpers` comment (line 281) through to `getInstalledProtocolIds()` (line 368). This includes:
- `private protocolInstaller` field
- `getProtocolInstaller()` method
- `installProtocolFromFile()` method
- `createInterviewForProtocol()` method
- `injectNetworkState()` method
- `uninstallProtocol()` method
- `cleanupInstalledProtocols()` method
- `getInstalledProtocolIds()` method

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No new errors. If there are errors about missing `InstalledProtocol` or protocol methods, it means a consumer was missed — check and fix.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fixtures/db-fixture.ts
git commit -m "refactor(e2e): remove protocol methods from DatabaseIsolation

Protocol installation is now handled by the dedicated ProtocolFixture."
```

### Task 5: Delete `helpers/protocol-installer.ts`

**Files:**
- Delete: `tests/e2e/helpers/protocol-installer.ts`

- [ ] **Step 1: Delete the file**

```bash
rm tests/e2e/helpers/protocol-installer.ts
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors. If there are import errors, a consumer was missed.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/helpers/protocol-installer.ts
git commit -m "remove(e2e): delete protocol-installer helper

Logic has been absorbed into fixtures/protocol-fixture.ts."
```

### Task 6: Remove `cleanupExtractedAssets` from global teardown

**Files:**
- Modify: `tests/e2e/global-teardown.ts`

- [ ] **Step 1: Remove the import and call**

Remove the import:
```typescript
import { cleanupExtractedAssets } from './helpers/protocol-installer.js';
```

Remove the usage block (lines 28-31):
```typescript
// Clean up extracted e2e assets from all standalone public directories
const projectRoot = path.resolve(import.meta.dirname, '../..');
const publicDir = path.join(projectRoot, '.next/standalone/public');
await cleanupExtractedAssets(publicDir);
```

Also remove `import path from 'node:path'` if it's no longer used by remaining code. Check: `path` is used on line 29 only, which is being removed. So remove the `path` import too.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/global-teardown.ts
git commit -m "refactor(e2e): remove asset cleanup from global teardown

Cleanup is now handled per-suite by ProtocolFixture's fixture teardown.
Stale assets from crashed workers are acceptable — they're overwritten
on next run and live inside .next/ (gitignored)."
```

### Task 7: Update `tests/e2e/CLAUDE.md`

**Files:**
- Modify: `tests/e2e/CLAUDE.md`

- [ ] **Step 1: Update file structure listing**

In the file structure section, remove `helpers/protocol-installer.ts` and add `fixtures/protocol-fixture.ts`:
```
├── fixtures/
│   ├── db-fixture.ts            # DatabaseIsolation class
│   ├── test.ts                  # Extended test with db fixture (browser tests)
│   ├── api-test.ts              # Extended test for API-only tests
│   ├── interview-test.ts        # Interview fixtures (interview, stage, protocol)
│   ├── interview-fixture.ts     # Interview page object model
│   ├── stage-fixture.ts         # Stage interaction fixture
│   ├── protocol-fixture.ts      # Protocol installation fixture
│   └── preview-protocol.ts      # Test protocol factory for preview tests
```

- [ ] **Step 2: Update database fixture methods section**

Remove the protocol-related methods from the "Database fixture methods" section. These were:
- `database.installProtocolFromFile()`
- `database.createInterviewForProtocol()`
- `database.injectNetworkState()`
- `database.uninstallProtocol()`
- `database.cleanupInstalledProtocols()`
- `database.getInstalledProtocolIds()`

- [ ] **Step 3: Add protocol fixture documentation**

Add a new section after the database fixture methods:

```markdown
### Protocol fixture methods

The `protocol` fixture is available in interview tests (import from `fixtures/interview-test.js`). It manages real `.netcanvas` protocol file installation with automatic cleanup via Playwright fixture teardown.

- `protocol.install(protocolPath)` — Install a `.netcanvas` file (extracts assets, inserts into DB). Returns `InstalledProtocol`.
- `protocol.createInterview(protocolId, participantIdentifier?)` — Create a Participant + Interview for the protocol. Returns interview ID.
- `protocol.injectNetworkState(interviewId, network, currentStep)` — Set interview starting state for stage tests.
- `protocol.uninstall(protocolId)` — Remove a specific protocol and its assets.

Cleanup is automatic — no `afterAll` needed.
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/CLAUDE.md
git commit -m "docs(e2e): update CLAUDE.md for protocol fixture

Removes protocol methods from database fixture docs, adds protocol
fixture documentation, updates file structure listing."
```

### Task 8: Format and lint

- [ ] **Step 1: Run formatter on all changed files**

```bash
pnpm prettier --write tests/e2e/fixtures/protocol-fixture.ts tests/e2e/fixtures/interview-test.ts tests/e2e/fixtures/db-fixture.ts tests/e2e/specs/interview/silos/interview.spec.ts tests/e2e/global-teardown.ts
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
git commit -m "style(e2e): format protocol fixture files"
```
