# Extract Protocol Installation Into a Dedicated Fixture

## Problem

The `ProtocolInstaller` helper class is instantiated inside `DatabaseIsolation` (the database fixture), but it doesn't fit the helper pattern used elsewhere in the e2e system. Helpers like `form.ts`, `dialog.ts`, and `table.ts` are stateless utilities. `ProtocolInstaller` holds state (tracks installed protocols), has lifecycle requirements (cleanup), and is only accessed through `DatabaseIsolation` proxy methods — never imported directly by tests.

This makes `DatabaseIsolation` a facade that hides what should be a first-class fixture, and forces tests to call `database.cleanupInstalledProtocols()` manually in `afterAll` instead of relying on Playwright's fixture teardown.

## Design

### New file: `fixtures/protocol-fixture.ts`

A `ProtocolFixture` class that absorbs all logic currently in `helpers/protocol-installer.ts`. The helper file is deleted — the fixture becomes the single home for protocol installation.

**Constructor:** Takes `databaseUrl`. Derives `publicDir` (`{projectRoot}/.next/standalone/public`) internally.

**Public API:**

| Method | Description |
|--------|-------------|
| `install(protocolPath)` | Read `.netcanvas` ZIP, extract `protocol.json` and assets, rewrite `asset://` URLs, insert protocol + assets via raw SQL. Returns `InstalledProtocol`. |
| `createInterview(protocolId, participantIdentifier?)` | Create a Participant + Interview with initial network state. Returns interview ID. |
| `injectNetworkState(interviewId, network, currentStep)` | Update interview state for stage preconditions. |
| `uninstall(protocolId)` | Delete protocol from DB (cascades) and remove asset directory. |
| `cleanup()` | Uninstall all tracked protocols and remove the `e2e-assets/` directory. |

**Private methods** (moved from `ProtocolInstaller`):
- `extractAssets(zip, assetDir)` — extract asset files from ZIP
- `rewriteAssetUrls(protocol, protocolId)` — replace `asset://` with `/e2e-assets/{id}/`
- `insertProtocol(protocolId, protocol)` — raw SQL insert into Protocol + Asset tables

**Exported type:** `InstalledProtocol` (moved from `helpers/protocol-installer.ts`).

### Fixture wiring in `interview-test.ts`

```typescript
protocol: [async ({ database }, use) => {
  const protocol = new ProtocolFixture(database.getDatabaseUrl());
  await use(protocol);
  await protocol.cleanup();
}, { scope: 'worker' }],
```

Worker-scoped, depends on `database` fixture. Cleanup is automatic via Playwright fixture teardown — tests never need manual `afterAll` for protocol cleanup.

### Changes to existing files

**`fixtures/db-fixture.ts`** — Remove all protocol-related code:
- Private `protocolInstaller` field and `getProtocolInstaller()` method
- `installProtocolFromFile()`, `createInterviewForProtocol()`, `injectNetworkState()`, `uninstallProtocol()`, `cleanupInstalledProtocols()`, `getInstalledProtocolIds()`
- `InstalledProtocol` re-export and `ProtocolInstaller` import

**`helpers/protocol-installer.ts`** — Delete entirely.

**`global-teardown.ts`** — Remove the `cleanupExtractedAssets` import and call. Cleanup is handled by the fixture teardown per-suite. The Docker environment does not require global asset cleanup.

**`specs/interview/silos/interview.spec.ts`** — Update to use `protocol` fixture:
- Import `InstalledProtocol` from `fixtures/protocol-fixture.js` instead of `fixtures/db-fixture.js`
- Replace `database.installProtocolFromFile()` with `protocol.install()`
- Replace `database.createInterviewForProtocol()` with `protocol.createInterview()`
- Remove the manual `afterAll` cleanup block

**`tests/e2e/CLAUDE.md`** — Update documentation:
- Remove protocol methods from database fixture docs
- Add `protocol` fixture documentation
- Update file structure listing (remove `helpers/protocol-installer.ts`, note `fixtures/protocol-fixture.ts`)
- Update the interview test spec example

### Test usage after refactor

```typescript
import { type InstalledProtocol } from '~/tests/e2e/fixtures/protocol-fixture.js';
import { expect, test } from '~/tests/e2e/fixtures/interview-test.js';

test.describe('SILOS Protocol', () => {
  test.describe.configure({ mode: 'serial' });

  let installedProtocol: InstalledProtocol;
  let interviewId: string;

  test.beforeAll(async ({ database, protocol }) => {
    await database.restoreSnapshot();
    installedProtocol = await protocol.install(SILOS_PROTOCOL_PATH);
    interviewId = await protocol.createInterview(installedProtocol.protocolId);
  });

  // No afterAll needed — fixture teardown handles cleanup

  test.beforeEach(({ interview }) => {
    interview.interviewId = interviewId;
  });

  test('Stage 0: Welcome', async ({ interview }) => {
    await interview.goto(0);
    // ...
  });
});
```

## Scope

Only the interview environment gets the `protocol` fixture. The fixture file is standalone and composable — it can be added to other fixture chains later if needed.
