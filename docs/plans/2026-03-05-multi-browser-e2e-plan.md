# Multi-Browser E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Firefox and WebKit to Playwright E2E tests with config-driven project generation, full browser isolation, and CI matrix support.

**Architecture:** A `BROWSERS` array and `ENVIRONMENTS` array in `test-config.ts` serve as the single source of truth. Pure functions derive Playwright projects, environment instances for global setup, context mappings for the database fixture, and per-browser auth state paths. Each browser gets its own DB container + app server per environment (6 total for 3 browsers x 2 environments), all started in parallel. CI uses a matrix strategy to run one browser per runner.

**Tech Stack:** Playwright, TypeScript, PostgreSQL (testcontainers), Next.js standalone server, GitHub Actions

**Design doc:** `docs/plans/2026-03-05-multi-browser-e2e-design.md`

---

## Important Context

There are TWO test systems in this project:
- **Active (`specs/`)**: Uses `fixtures/test.ts` with `DatabaseIsolation` (advisory locks). Configured in `playwright.config.ts`.
- **WIP (`suites/`)**: Uses `fixtures/fixtures.ts` with `context-resolver.ts` and `DatabaseSnapshots`. NOT in the Playwright config yet.

The WIP system's `context-resolver.ts` imports `CONTEXT_MAPPINGS` from `test-config.ts`. When we replace `CONTEXT_MAPPINGS` with `getContextMappings()`, we must update `context-resolver.ts` to stay compatible even though it's not yet active.

---

### Task 1: Rewrite `test-config.ts` with BROWSERS, ENVIRONMENTS, and derived functions

**Files:**
- Rewrite: `tests/e2e/config/test-config.ts`

**Step 1: Write the new `test-config.ts`**

Replace the entire file. The new version defines `BROWSERS`, `ENVIRONMENTS`, and all derived functions. `saveAuthState` now takes a `path` parameter. `AUTH_STATE_PATH` and `CONTEXT_MAPPINGS` are removed.

```ts
/* eslint-disable no-process-env */
import { type BrowserContext, type Page, devices } from '@playwright/test';
import {
  seedDashboardEnvironment,
  seedSetupEnvironment,
} from '../helpers/seed.js';

type BrowserConfig = {
  name: string;
  device: typeof devices[string];
};

type EnvironmentConfig = {
  id: string;
  testMatch: string;
  seed: (connectionUri: string) => Promise<void>;
  auth: boolean;
};

export const BROWSERS: BrowserConfig[] = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

export const ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: 'setup',
    testMatch: '**/setup/*.spec.ts',
    seed: seedSetupEnvironment,
    auth: false,
  },
  {
    id: 'dashboard',
    testMatch: '**/dashboard/*.spec.ts',
    seed: seedDashboardEnvironment,
    auth: true,
  },
];

export function envInstanceId(envId: string, browserName: string): string {
  return `${envId}-${browserName}`;
}

export function envUrlVar(instanceId: string): string {
  return `${instanceId.toUpperCase().replace(/-/g, '_')}_URL`;
}

export function authStatePath(envId: string, browserName: string): string {
  return `./tests/e2e/.auth/${envId}-${browserName}.json`;
}

export function authStatePathForProject(projectName: string): string {
  // Auth project names follow pattern: auth-{envId}-{browser}
  // Strip the "auth-" prefix to get the instance ID, then split
  const instanceId = projectName.replace(/^auth-/, '');
  const lastDash = instanceId.lastIndexOf('-');
  const envId = instanceId.substring(0, lastDash);
  const browserName = instanceId.substring(lastDash + 1);
  return authStatePath(envId, browserName);
}

export function getEnvironmentInstances(): {
  suiteId: string;
  seed: (connectionUri: string) => Promise<void>;
}[] {
  return BROWSERS.flatMap((browser) =>
    ENVIRONMENTS.map((env) => ({
      suiteId: envInstanceId(env.id, browser.name),
      seed: env.seed,
    })),
  );
}

export function getProjects(): {
  name: string;
  testMatch: string;
  dependencies?: string[];
  use: Record<string, unknown>;
}[] {
  return BROWSERS.flatMap((browser) =>
    ENVIRONMENTS.flatMap((env) => {
      const projects = [];
      const instanceId = envInstanceId(env.id, browser.name);
      const baseURL = process.env[envUrlVar(instanceId)];

      if (env.auth) {
        projects.push({
          name: `auth-${instanceId}`,
          testMatch: '**/auth/*.spec.ts',
          use: {
            ...browser.device,
            baseURL,
          },
        });

        projects.push({
          name: instanceId,
          testMatch: env.testMatch,
          dependencies: [`auth-${instanceId}`],
          use: {
            ...browser.device,
            baseURL,
            storageState: authStatePath(env.id, browser.name),
          },
        });
      } else {
        projects.push({
          name: instanceId,
          testMatch: env.testMatch,
          use: {
            ...browser.device,
            baseURL,
          },
        });
      }

      return projects;
    }),
  );
}

export function getContextMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};
  for (const browser of BROWSERS) {
    for (const env of ENVIRONMENTS) {
      const instanceId = envInstanceId(env.id, browser.name);
      mappings[instanceId] = instanceId;
      if (env.auth) {
        mappings[`auth-${instanceId}`] = instanceId;
      }
    }
  }
  return mappings;
}

export async function saveAuthState(
  pageOrContext: Page | BrowserContext,
  statePath: string,
): Promise<void> {
  const context =
    'context' in pageOrContext ? pageOrContext.context() : pageOrContext;
  await context.storageState({ path: statePath });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Type errors in files that still import `AUTH_STATE_PATH` or `CONTEXT_MAPPINGS` (these will be fixed in subsequent tasks). The config file itself should be clean.

**Step 3: Commit**

```bash
git add tests/e2e/config/test-config.ts
git commit -m "refactor(e2e): rewrite test-config with BROWSERS, ENVIRONMENTS, and derived functions"
```

---

### Task 2: Update `playwright.config.ts` to use generated projects

**Files:**
- Modify: `tests/e2e/playwright.config.ts`

**Step 1: Rewrite the config**

Replace the hardcoded projects with `getProjects()` and update the snapshot path template.

```ts
/* eslint-disable no-process-env */
import { defineConfig } from '@playwright/test';
import { getProjects } from './config/test-config.js';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  snapshotDir: './visual-snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',

  retries: 0,
  fullyParallel: false,

  reporter: [
    ['line'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  timeout: 60_000,

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1920, height: 1080 },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: getProjects(),
});
```

**Step 2: Verify config loads**

Run: `pnpm exec playwright test --config=tests/e2e/playwright.config.ts --list`

Expected: Lists projects like `setup-chromium`, `setup-firefox`, `setup-webkit`, `auth-dashboard-chromium`, `dashboard-chromium`, etc. (9 projects total: 3 setup + 3 auth + 3 dashboard). Base URLs will be undefined (env vars not set outside of global setup) — this is expected.

**Step 3: Commit**

```bash
git add tests/e2e/playwright.config.ts
git commit -m "refactor(e2e): use generated projects in playwright config"
```

---

### Task 3: Update `global-setup.ts` to start all browser environments

**Files:**
- Modify: `tests/e2e/global-setup.ts`

**Step 1: Rewrite global setup**

Replace the hardcoded two-environment startup with dynamic generation from `getEnvironmentInstances()`.

```ts
/* eslint-disable no-process-env */
import { AppServer, resetPortAllocation } from './helpers/AppServer.js';
import { type SuiteContext, saveContext } from './helpers/context.js';
import { log, logError } from './helpers/logger.js';
import { TestDatabase } from './helpers/TestDatabase.js';
import { envUrlVar, getEnvironmentInstances } from './config/test-config.js';

declare global {
  var __TEST_DBS__: TestDatabase[];
  var __APP_SERVERS__: AppServer[];
}

async function startEnvironment(
  suiteId: string,
  seedFn: (connectionUri: string) => Promise<void>,
): Promise<{ db: TestDatabase; server: AppServer; context: SuiteContext }> {
  const db = await TestDatabase.start();
  db.runMigrations();
  await seedFn(db.connectionUri);

  const server = await AppServer.start({
    suiteId,
    databaseUrl: db.connectionUri,
  });

  await db.createSnapshot(suiteId, 'initial');

  return {
    db,
    server,
    context: {
      suiteId,
      appUrl: server.url,
      databaseUrl: db.connectionUri,
    },
  };
}

export default async function globalSetup() {
  log('setup', '=== E2E Global Setup Starting ===');

  try {
    resetPortAllocation();
    AppServer.ensureBuild();

    const instances = getEnvironmentInstances();
    const environments = await Promise.all(
      instances.map((inst) => startEnvironment(inst.suiteId, inst.seed)),
    );

    const suites: Record<string, SuiteContext> = {};
    for (const env of environments) {
      suites[env.context.suiteId] = env.context;
      process.env[envUrlVar(env.context.suiteId)] = env.server.url;
    }
    await saveContext(suites);

    globalThis.__TEST_DBS__ = environments.map((e) => e.db);
    globalThis.__APP_SERVERS__ = environments.map((e) => e.server);

    log('setup', '=== E2E Global Setup Complete ===');
    for (const env of environments) {
      log('setup', `${env.context.suiteId} URL: ${env.server.url}`);
    }
  } catch (error) {
    logError('setup', 'Global setup failed', error);
    throw error;
  }
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Clean (or only errors from files not yet updated).

**Step 3: Commit**

```bash
git add tests/e2e/global-setup.ts
git commit -m "refactor(e2e): dynamically start all browser environments in global setup"
```

---

### Task 4: Update the database fixture in `fixtures/test.ts`

**Files:**
- Modify: `tests/e2e/fixtures/test.ts:91-105`

**Step 1: Update the database fixture**

Replace the hardcoded project-to-suite mapping with `getContextMappings()`.

Change lines 91-105 from:

```ts
export const test = base.extend<TestFixtures, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      // Worker-scoped so it can be used in beforeAll hooks
      // Map project name to suite ID
      const projectName = workerInfo.project.name;
      const suiteId = projectName === 'setup' ? 'setup' : 'dashboard';
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);

      await use(db);
    },
    { scope: 'worker' },
  ],
```

To:

```ts
export const test = base.extend<TestFixtures, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const mappings = getContextMappings();
      const suiteId = mappings[projectName];
      if (!suiteId) {
        throw new Error(
          `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
        );
      }
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);

      await use(db);
    },
    { scope: 'worker' },
  ],
```

Also add the import at the top of the file (after existing imports):

```ts
import { getContextMappings } from '../config/test-config.js';
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Clean for this file.

**Step 3: Commit**

```bash
git add tests/e2e/fixtures/test.ts
git commit -m "refactor(e2e): use getContextMappings() in database fixture"
```

---

### Task 5: Update `specs/auth/login.spec.ts` for per-browser auth state

**Files:**
- Modify: `tests/e2e/specs/auth/login.spec.ts`

**Step 1: Update auth spec**

The auth spec must save state to a browser-specific path derived from the project name.

```ts
import { authStatePathForProject, saveAuthState } from '../../config/test-config.js';
import { expect, expectURL, test } from '../../fixtures/test.js';
import { fillField } from '../../helpers/form.js';
import fs from 'node:fs/promises';
import path from 'node:path';

test.describe('Sign In Page', () => {
  test('visual: sign in page', async ({ page, capturePage }) => {
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await capturePage('signin-page');
  });

  test('trouble signing in link visible', async ({ page }) => {
    await page.goto('/signin');
    await expect(
      page.getByRole('button', { name: /trouble signing in/i }),
    ).toBeVisible();
  });

  test('authenticate as admin and save state', async ({ page }, testInfo) => {
    const statePath = authStatePathForProject(testInfo.project.name);
    await fs.mkdir(path.dirname(statePath), { recursive: true });

    await page.goto('/signin');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await fillField(page, 'username', 'testadmin');
    await fillField(page, 'password', 'TestAdmin123!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expectURL(page, /\/dashboard/);

    await saveAuthState(page, statePath);
  });
});
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Clean.

**Step 3: Commit**

```bash
git add tests/e2e/specs/auth/login.spec.ts
git commit -m "refactor(e2e): save per-browser auth state in login spec"
```

---

### Task 6: Update `context-resolver.ts` for compatibility

**Files:**
- Modify: `tests/e2e/fixtures/context-resolver.ts:4,115-145`

**Step 1: Update imports and usage**

The `context-resolver.ts` (used by the WIP `suites/` system) imports `CONTEXT_MAPPINGS` which no longer exists. Update it to use `getContextMappings()`.

Replace line 4:
```ts
import { CONTEXT_MAPPINGS } from '../config/test-config';
```
With:
```ts
import { getContextMappings } from '../config/test-config';
```

Replace `inferContextFromTestPath` function (lines 103-128). The `suiteToContext` mapping is no longer a separate thing — derive it from `getContextMappings()`. The function matches path segments like `suites/dashboard/` to context keys. With dynamic mappings, we can match against the environment IDs extracted from instance IDs.

```ts
function inferContextFromTestPath(
  testInfo: TestInfo,
  contexts: Record<string, SerializedContext>,
): SerializedContext | null {
  if (!testInfo.file) {
    return null;
  }

  const pathParts = testInfo.file.split('/');
  const suitesIndex = pathParts.findIndex((part) => part === 'suites');

  if (suitesIndex >= 0 && pathParts.length > suitesIndex + 1) {
    const suiteName = pathParts[suitesIndex + 1];
    if (suiteName && contexts[suiteName]) {
      return contexts[suiteName];
    }
  }

  return null;
}
```

Replace `inferContextFromProject` function (lines 133-152):

```ts
function inferContextFromProject(
  testInfo: TestInfo,
  contexts: Record<string, SerializedContext>,
): SerializedContext | null {
  if (!testInfo.project?.name) {
    return null;
  }

  const mappings = getContextMappings();
  const contextKey = mappings[testInfo.project.name];
  if (contextKey && contexts[contextKey]) {
    return contexts[contextKey];
  }

  return null;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Clean.

**Step 3: Commit**

```bash
git add tests/e2e/fixtures/context-resolver.ts
git commit -m "refactor(e2e): update context-resolver to use getContextMappings()"
```

---

### Task 7: Update `suites/auth/dashboard-setup.spec.ts` for compatibility

**Files:**
- Modify: `tests/e2e/suites/auth/dashboard-setup.spec.ts`

**Step 1: Update auth spec in suites**

Replace the removed `AUTH_STATE_PATH` import with `authStatePathForProject`.

```ts
import { test } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { authStatePathForProject, saveAuthState } from '../../config/test-config.js';

test('authenticate as admin for dashboard', async ({ page, context }, testInfo) => {
  const statePath = authStatePathForProject(testInfo.project.name);
  await fs.mkdir(path.dirname(statePath), { recursive: true });

  await page.goto('/signin');

  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).fill('Administrator1!');

  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(
    /\/(dashboard|protocols|home|participants|interviews)/,
    { timeout: 10000 },
  );

  await saveAuthState(context, statePath);
});
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: Clean.

**Step 3: Commit**

```bash
git add tests/e2e/suites/auth/dashboard-setup.spec.ts
git commit -m "refactor(e2e): update suites auth spec for per-browser auth paths"
```

---

### Task 8: Update `.github/workflows/e2e.yml` with browser matrix

**Files:**
- Modify: `.github/workflows/e2e.yml:14-59`

**Step 1: Add matrix strategy to e2e job**

Update the `e2e` job to use a browser matrix. Each runner handles one browser. Artifact names must be unique per matrix entry.

Replace lines 14-59 with:

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    outputs:
      test-result: ${{ steps.test.outcome }}

    steps:
      - name: Setup
        id: setup
        uses: complexdatacollective/github-actions/setup-pnpm@v1
        with:
          install: 'false'
          cache-path: .pnpm-docker-store
          cache-key-prefix: pnpm-docker-store

      - name: Run E2E tests (${{ matrix.browser }})
        id: test
        run: pnpm test:e2e -- --project="*-${{ matrix.browser }}"
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: |
            tests/e2e/playwright-report/
            tests/e2e/test-results/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-videos-${{ matrix.browser }}
          path: tests/e2e/test-results/**/*.webm
          retention-days: 7

      - name: Save pnpm cache
        if: always() && steps.setup.outputs.cache-hit != 'true'
        uses: actions/cache/save@v4
        with:
          path: .pnpm-docker-store
          key: ${{ steps.setup.outputs.cache-key }}
```

Also update the `resolve-pr` job's condition to check across matrix runs. Change line 62-63:

```yaml
  resolve-pr:
    if: failure()
    needs: e2e
```

Note: `fail-fast: false` ensures all browsers run even if one fails, so you get full cross-browser results.

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml'))"`

Expected: No errors.

**Step 3: Commit**

```bash
git add .github/workflows/e2e.yml
git commit -m "ci(e2e): add browser matrix strategy for parallel cross-browser testing"
```

---

### Task 9: Delete old visual snapshots and add `.gitkeep` for new directories

**Files:**
- Delete: `tests/e2e/visual-snapshots/*.png` (all files in flat directory)
- Create: `tests/e2e/visual-snapshots/.gitkeep`

**Step 1: Remove old snapshots**

The old flat snapshots are incompatible with the new `{projectName}/` subdirectory structure.

```bash
rm tests/e2e/visual-snapshots/*.png
```

**Step 2: Add .gitkeep**

```bash
touch tests/e2e/visual-snapshots/.gitkeep
```

**Step 3: Commit**

```bash
git add tests/e2e/visual-snapshots/
git commit -m "chore(e2e): remove old flat visual snapshots for per-browser subdirectory structure"
```

---

### Task 10: Update `tests/e2e/.gitignore` for per-browser auth files

**Files:**
- Modify or create: `tests/e2e/.gitignore`

**Step 1: Check current .gitignore**

Look for existing entries covering `.auth/`. If `.auth/` is already ignored, no change needed. If not, or if it only ignores `admin.json`, update to ignore the whole `.auth/` directory.

Ensure these entries exist:
```
.auth/
.context/
.db-snapshots/
```

**Step 2: Commit (if changed)**

```bash
git add tests/e2e/.gitignore
git commit -m "chore(e2e): update .gitignore for per-browser auth state files"
```

---

### Task 11: Run full typecheck and lint

**Step 1: Typecheck**

Run: `pnpm typecheck`

Expected: Clean. All removed exports (`AUTH_STATE_PATH`, `CONTEXT_MAPPINGS`) have been replaced in their consumers.

**Step 2: Lint**

Run: `pnpm lint --fix`

Expected: Clean or auto-fixed.

**Step 3: Format**

Run: `pnpm prettier --write tests/e2e/ .github/workflows/e2e.yml`

**Step 4: Commit any formatting changes**

```bash
git add -A
git commit -m "chore: lint and format e2e test changes"
```

---

### Task 12: Verify Playwright config generates correct projects

**Step 1: List projects**

Run: `pnpm exec playwright test --config=tests/e2e/playwright.config.ts --list 2>&1 | head -30`

Expected output should show 9 projects:
- `setup-chromium`, `setup-firefox`, `setup-webkit`
- `auth-dashboard-chromium`, `auth-dashboard-firefox`, `auth-dashboard-webkit`
- `dashboard-chromium`, `dashboard-firefox`, `dashboard-webkit`

**Step 2: Verify browser filtering works**

Run: `pnpm exec playwright test --config=tests/e2e/playwright.config.ts --list --project="*-chromium" 2>&1 | head -20`

Expected: Only shows `setup-chromium`, `auth-dashboard-chromium`, `dashboard-chromium`.

**Step 3: No commit needed (verification only)**

---

### Task 13: Generate new visual snapshots for Chromium

Visual snapshots must be regenerated since the path template changed. This requires running tests in Docker (`CI=true`).

**Step 1: Generate Chromium snapshots**

Run: `./scripts/run-e2e-docker.sh --project="*-chromium" --update-snapshots`

Expected: Tests run and create snapshot files under `visual-snapshots/setup-chromium/` and `visual-snapshots/dashboard-chromium/` (and `visual-snapshots/auth-dashboard-chromium/` if the auth spec has visual tests).

**Step 2: Verify snapshots created**

Run: `find tests/e2e/visual-snapshots -name '*.png' | head -20`

Expected: Files like `visual-snapshots/dashboard-chromium/dashboard-page-phone.png`.

**Step 3: Commit**

```bash
git add tests/e2e/visual-snapshots/
git commit -m "chore(e2e): regenerate visual snapshots for chromium under new directory structure"
```

---

### Task 14: Generate visual snapshots for Firefox and WebKit

**Step 1: Generate Firefox snapshots**

Run: `./scripts/run-e2e-docker.sh --project="*-firefox" --update-snapshots`

**Step 2: Generate WebKit snapshots**

Run: `./scripts/run-e2e-docker.sh --project="*-webkit" --update-snapshots`

**Step 3: Verify all browser snapshots exist**

Run: `ls tests/e2e/visual-snapshots/`

Expected: Directories for each project: `setup-chromium`, `setup-firefox`, `setup-webkit`, `dashboard-chromium`, `dashboard-firefox`, `dashboard-webkit`, plus auth directories if applicable.

**Step 4: Commit**

```bash
git add tests/e2e/visual-snapshots/
git commit -m "chore(e2e): add visual snapshots for firefox and webkit"
```

---

### Task 15: Full test run verification

**Step 1: Run all browsers locally in Docker**

Run: `./scripts/run-e2e-docker.sh`

Expected: All 9 projects pass. The 3 browser chains run in parallel. Each chain has its own DB + server.

**Step 2: Run single browser to verify filtering**

Run: `./scripts/run-e2e-docker.sh --project="*-firefox"`

Expected: Only Firefox projects run (setup-firefox, auth-dashboard-firefox, dashboard-firefox).

**Step 3: No commit needed (verification only)**

---

### Task 16: Update E2E documentation

**Files:**
- Modify: `tests/e2e/CLAUDE.md`
- Modify: `tests/e2e/README.md`

**Step 1: Update CLAUDE.md**

Update the architecture section, project table, file structure, and add documentation about:
- The `BROWSERS` and `ENVIRONMENTS` config arrays
- Per-browser isolation (separate DB + server per browser)
- How to add/remove browsers
- How to run a single browser locally: `--project="*-chromium"`
- CI matrix strategy

**Step 2: Update README.md**

Update the quick start section with new commands for single-browser runs.

**Step 3: Commit**

```bash
git add tests/e2e/CLAUDE.md tests/e2e/README.md
git commit -m "docs(e2e): update documentation for multi-browser test configuration"
```
