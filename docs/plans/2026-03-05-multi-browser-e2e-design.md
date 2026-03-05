# Multi-Browser E2E Test Design

## Goal

Add Firefox and WebKit to the Playwright E2E test suite alongside Chromium, with full browser isolation, parallel execution, and CI matrix support.

## Configuration Source of Truth

`tests/e2e/config/test-config.ts` defines two arrays from which everything else is derived:

```ts
export const BROWSERS = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
] as const;

export const ENVIRONMENTS = [
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
] as const;
```

Adding/removing a browser = one line. Adding/removing an environment = one object.

## Derived Values

Pure functions in `test-config.ts` generate all downstream configuration:

| Function | Returns | Consumed by |
|----------|---------|-------------|
| `getProjects()` | Playwright project definitions | `playwright.config.ts` |
| `getEnvironmentInstances()` | Suite IDs + seed functions for all DB/server combos | `global-setup.ts` |
| `getContextMappings()` | Project name to suite ID map | `fixtures/test.ts` (database fixture) |
| `authStatePath(envId, browser)` | Per-browser auth state file path | `specs/auth/login.spec.ts` |
| `authStatePathForProject(projectName)` | Auth path derived from project name | `specs/auth/login.spec.ts` |
| `envInstanceId(envId, browser)` | `{envId}-{browser}` composite key | Internal to other functions |
| `envUrlVar(instanceId)` | Environment variable name for app URL | `global-setup.ts`, `playwright.config.ts` |

### Naming Conventions

All names follow `{envId}-{browser}` pattern:

- Suite/instance IDs: `setup-chromium`, `dashboard-firefox`, etc.
- Auth projects: `auth-dashboard-chromium`, `auth-dashboard-webkit`, etc.
- Auth state files: `.auth/dashboard-chromium.json`, `.auth/dashboard-firefox.json`, etc.
- Env vars: `SETUP_CHROMIUM_URL`, `DASHBOARD_FIREFOX_URL`, etc.

The `{envId}-{browser}` suffix convention enables CLI filtering: `--project="*-chromium"` matches all projects for a single browser.

## Infrastructure Architecture

Each browser gets full isolation: its own DB container + app server per environment.

```
Global Setup (all in parallel)
+-- setup-chromium       -> 1 PostgreSQL container + 1 Next.js server
+-- setup-firefox        -> 1 PostgreSQL container + 1 Next.js server
+-- setup-webkit         -> 1 PostgreSQL container + 1 Next.js server
+-- dashboard-chromium   -> 1 PostgreSQL container + 1 Next.js server
+-- dashboard-firefox    -> 1 PostgreSQL container + 1 Next.js server
+-- dashboard-webkit     -> 1 PostgreSQL container + 1 Next.js server
```

Total: 6 DB containers + 6 app servers. All share the same Next.js build artifact.

### Dependency Chains

Setup and dashboard environments are independent per browser. Auth-enabled environments generate an auth project that the main project depends on.

```
chromium:  setup-chromium                         (independent)
           auth-dashboard-chromium -> dashboard-chromium

firefox:   setup-firefox                          (independent)
           auth-dashboard-firefox  -> dashboard-firefox

webkit:    setup-webkit                           (independent)
           auth-dashboard-webkit   -> dashboard-webkit
```

All 6 chains run in parallel. Within each chain, the advisory lock system coordinates read-only vs mutation tests as before.

## Consumer Changes

### `playwright.config.ts`

- Calls `getProjects()` instead of hardcoding projects
- `snapshotPathTemplate` changes to `{snapshotDir}/{projectName}/{arg}{ext}`
- All other shared config (timeouts, reporters, etc.) unchanged

### `global-setup.ts`

- Calls `getEnvironmentInstances()` to get the list of suite IDs + seed functions
- Starts all instances in parallel with `Promise.all`
- Sets env vars dynamically using `envUrlVar()`
- No hardcoded environment names

### `global-teardown.ts`

- No changes needed. Already iterates over `__TEST_DBS__` and `__APP_SERVERS__` generically.

### `fixtures/test.ts`

- Database fixture calls `getContextMappings()` to resolve project name to suite ID
- Replaces the hardcoded `projectName === 'setup' ? 'setup' : 'dashboard'` logic

### `config/test-config.ts`

- `BROWSERS` and `ENVIRONMENTS` arrays added
- All generation functions added
- `saveAuthState` updated to accept a path parameter
- `AUTH_STATE_PATH` constant removed (replaced by `authStatePath()` function)
- `CONTEXT_MAPPINGS` constant removed (replaced by `getContextMappings()` function)

### `specs/auth/login.spec.ts`

- Resolves auth path from project name using `authStatePathForProject(testInfo.project.name)`
- Passes path to `saveAuthState()`

### All other spec files

- No changes. They use the `database` fixture and `capturePage`/`captureElement` which resolve everything via project name.

## Visual Snapshots

Snapshots move from a flat directory to per-project subdirectories:

```
visual-snapshots/
+-- setup-chromium/
|   +-- setup-step-1-create-account-phone.png
+-- setup-firefox/
+-- setup-webkit/
+-- dashboard-chromium/
|   +-- dashboard-page-phone.png
+-- dashboard-firefox/
+-- dashboard-webkit/
```

Each browser gets its own baselines (rendering differs across engines). Existing Chrome snapshots must be regenerated after the path template change.

`maxDiffPixelRatio` stays at `0.01` globally. Adjust per-browser only if flakiness emerges.

## CI Strategy

### Matrix per browser

Each GitHub Actions runner handles one browser. This keeps resource usage per runner identical to today's single-browser run (2 containers + 2 servers).

```yaml
jobs:
  e2e:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - run: pnpm test:e2e -- --project="*-${{ matrix.browser }}"
```

### Local development

- `pnpm test:e2e` runs all browsers in parallel (full suite)
- `pnpm test:e2e -- --project="*-chromium"` runs one browser
- `pnpm test:e2e -- --project="dashboard-chromium"` runs one environment + browser

### Docker script

No changes. Already passes through args and the Playwright image includes all browsers.

### Artifacts

No changes to upload paths. The Playwright HTML report groups results by project name automatically.

## Resource Profile

| | Per runner (CI matrix) | Local (all browsers) |
|---|---|---|
| PostgreSQL containers | 2 | 6 |
| App server processes | 2 | 6 |
| Build step | 1 | 1 |
| RAM estimate | ~1 GB | ~2.5 GB |
| Wall-clock time | ~same as today | ~same as today (parallel) |
