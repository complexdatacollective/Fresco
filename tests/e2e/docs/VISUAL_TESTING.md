# Visual Regression Testing Guide

This guide explains how to use the visual snapshot system for consistent and reliable visual regression testing in the Fresco e2e test suite.

## Overview

Visual regression testing helps catch unintended UI changes by comparing screenshots of the application against known good baselines. Our system provides:

- **Integrated fixtures**: Visual snapshots available as test fixtures, no manual setup required
- **Consistent snapshots**: Automatic handling of animations, dynamic content, and timing
- **Reusable configurations**: Predefined settings for common UI patterns
- **Easy baseline management**: Scripts to generate and update baselines
- **Flexible options**: Customizable thresholds, masking, and clipping

## Quick Start

### 1. Import the Test Framework

```typescript
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/test';
```

### 2. Basic Usage

The `snapshots` fixture is automatically available in every test:

```typescript
test('should match visual snapshot', async ({ page, snapshots }) => {
  // Wait for page to be stable
  await snapshots.waitForStablePage();

  // Take snapshot using predefined config
  await snapshots.expectPageToMatchSnapshot(
    SNAPSHOT_CONFIGS.page('my-page-name'),
  );
});
```

No need to manually create snapshot instances - the fixture system handles everything!

## Predefined Configurations

The system includes several predefined configurations for common use cases:

### Page Snapshots

```typescript
// Standard page snapshot
SNAPSHOT_CONFIGS.page('dashboard-overview');

// Full page snapshot (includes scroll areas)
SNAPSHOT_CONFIGS.fullPage('complete-page-view');
```

### Component Snapshots

```typescript
// Component/element snapshot
SNAPSHOT_CONFIGS.component('user-profile-card');

// Table/data grid snapshot
SNAPSHOT_CONFIGS.table('participants-list');

// Modal/dialog snapshot
SNAPSHOT_CONFIGS.modal('confirmation-dialog');

// Empty state snapshot
SNAPSHOT_CONFIGS.emptyState('no-participants');
```

## Custom Configuration

For more control, create custom configurations:

```typescript
await snapshots.expectPageToMatchSnapshot({
  name: 'custom-snapshot',
  threshold: 0.05, // 5% difference allowed
  maxDiffPixels: 200, // Max 200 pixels different
  fullPage: true, // Full page screenshot
  animations: 'disable', // Disable animations
  waitTime: 1500, // Wait 1.5s before screenshot
  waitForSelector: '.data-loaded', // Wait for specific element
  viewport: { width: 1280, height: 720 }, // Custom viewport
  mask: ['.dynamic-content'], // Hide dynamic elements
});
```

## Element Snapshots

Capture specific elements instead of the whole page:

```typescript
test('should match modal snapshot', async ({ page, snapshots }) => {
  // Open modal
  await page.click('[data-testid="open-modal"]');

  // Snapshot just the modal
  const modal = page.locator('[role="dialog"]');
  await snapshots.expectElementToMatchSnapshot(
    modal,
    SNAPSHOT_CONFIGS.modal('user-settings-modal'),
  );
});
```

## Generating Baselines

### Docker Requirement for Snapshot Generation

**Important**: Visual snapshots must be generated in a Linux environment using Docker to ensure consistency with CI. This is because:

- CI runs on Linux, so font rendering, anti-aliasing, and pixel-level details differ from macOS/Windows
- The official Playwright Docker image provides a consistent environment across all machines
- Snapshots generated locally on macOS will not match CI and tests will fail

**Prerequisites**:

- Docker must be installed and running
- Run `pnpm build` first to create the standalone build (if not already done)

### Generating or Updating Snapshots (Recommended)

Use the Docker-based script to generate snapshots that match CI:

```bash
# Update all visual snapshots using Docker (matches CI environment)
pnpm test:e2e:update-snapshots
```

This command:

1. Runs Playwright inside a Linux Docker container
2. Mounts the Docker socket so testcontainers can create PostgreSQL databases
3. Generates `-linux.png` snapshot files that match CI

### Initial Setup

When creating new visual tests, you need to generate baseline screenshots:

```bash
# Generate baselines using Docker (recommended)
pnpm test:e2e:update-snapshots

# Or if you only need to generate specific test snapshots:
./scripts/update-e2e-snapshots.sh
```

### Updating Existing Baselines

When UI changes are intentional and you need to update baselines:

```bash
# Update all baselines using Docker (recommended)
pnpm test:e2e:update-snapshots
```

### Local Development (macOS/Windows)

For local development and debugging, you can run tests directly, but be aware that:

- Visual snapshots will use platform-specific baselines (`-darwin.png` or `-win32.png`)
- These local baselines won't exist unless you create them
- For CI compatibility, always use the Docker-based approach above

```bash
# Run tests locally (may fail visual comparisons without local baselines)
pnpm test:e2e

# Update local baselines (not recommended for CI compatibility)
npx playwright test --update-snapshots
```

## Best Practices

### 1. Naming Conventions

- Use descriptive names: `participants-table-loaded` not `test1`
- Include state information: `modal-error-state`, `table-empty-state`
- Use kebab-case: `user-profile-edit-mode`

### 2. Test Organization

```typescript
test.describe('Visual Snapshots', () => {
  test('baseline state', async ({ page }) => {
    // Test the default/loaded state
  });

  test('empty state', async ({ page }) => {
    // Test empty/no-data state
  });

  test('error state', async ({ page }) => {
    // Test error conditions
  });
});
```

### 3. Wait for Stability

Always ensure the page is stable before taking snapshots:

```typescript
// Good: Wait for stability
await snapshots.waitForStablePage();

// Better: Wait for specific content
await page.waitForSelector('[data-testid="content-loaded"]');
await snapshots.waitForStablePage();

// Best: Use built-in waiting
await snapshots.expectPageToMatchSnapshot(
  SNAPSHOT_CONFIGS.table('participants-list'), // Includes table waiting
);
```

### 4. Handle Dynamic Content

The system automatically handles common dynamic content, but you can add custom handling:

```typescript
await snapshots.expectPageToMatchSnapshot({
  name: 'user-dashboard',
  mask: [
    '.timestamp', // Hide timestamps
    '.user-avatar', // Hide user-specific content
    '[data-dynamic="true"]', // Hide marked dynamic content
  ],
});
```

## Configuration Options

| Option            | Type     | Default   | Description                            |
| ----------------- | -------- | --------- | -------------------------------------- |
| `name`            | string   | required  | Snapshot file name (without .png)      |
| `threshold`       | number   | 0.1       | Pixel difference threshold (0.0-1.0)   |
| `maxDiffPixels`   | number   | 100       | Maximum different pixels allowed       |
| `animations`      | string   | 'disable' | Animation handling ('disable'/'allow') |
| `fullPage`        | boolean  | false     | Take full page screenshot              |
| `waitTime`        | number   | undefined | Additional wait time (ms)              |
| `waitForSelector` | string   | undefined | Selector to wait for                   |
| `viewport`        | object   | undefined | Custom viewport size                   |
| `mask`            | string[] | undefined | Selectors to hide                      |
| `clip`            | object   | undefined | Clip to specific area                  |

## Troubleshooting

### Flaky Tests

If visual tests are flaky:

1. **Increase wait time**: `waitTime: 2000`
2. **Wait for specific elements**: `waitForSelector: '.content-loaded'`
3. **Mask dynamic content**: `mask: ['.timestamp', '.loading-spinner']`
4. **Increase threshold**: `threshold: 0.2`

### Large Differences

For legitimate UI changes:

1. **Review changes**: Ensure they're intentional
2. **Update baselines**: Run with `--update-snapshots`
3. **Adjust threshold**: If minor differences are acceptable

### Missing Elements

If elements aren't visible in snapshots:

1. **Check timing**: Add `waitForSelector` or `waitTime`
2. **Verify selectors**: Ensure elements exist and are visible
3. **Check viewport**: Some elements might be outside viewport

### CI/CD Issues

For consistent results across environments:

1. **Use Docker**: Consistent rendering environment
2. **Set fixed viewport**: Ensure same size across runs
3. **Disable animations**: Prevent timing-based differences

## Example Test File

```typescript
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/test';

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('dashboard overview matches snapshot', async ({ page, snapshots }) => {
    await snapshots.waitForStablePage();
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.page('dashboard-overview'),
    );
  });

  test('empty state matches snapshot', async ({ page, snapshots }) => {
    // Clear all data to show empty state
    await clearAllData(page);

    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.emptyState('dashboard-empty'),
    );
  });

  test('user menu modal matches snapshot', async ({ page, snapshots }) => {
    await page.click('[data-testid="user-menu"]');

    const modal = page.locator('[role="menu"]');
    await snapshots.expectElementToMatchSnapshot(
      modal,
      SNAPSHOT_CONFIGS.modal('user-menu'),
    );
  });
});
```

## Integration with CI/CD

Add visual regression testing to your CI pipeline:

```yaml
# .github/workflows/visual-tests.yml
- name: Run Visual Regression Tests
  run: |
    npx playwright test --grep "visual snapshot" --reporter=github

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: visual-test-results
    path: |
      test-results/
      playwright-report/
```

This system provides a robust foundation for visual regression testing that scales with your application's complexity while maintaining consistency and reliability.
