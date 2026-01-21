# E2E Testing System

This directory contains the end-to-end testing system for Fresco, including comprehensive test suites, fixtures, and utilities.

## Quick Start

### Running Tests

```bash
# Run all e2e tests
npx playwright test --config tests/e2e/playwright.config.ts

# Run specific test suite
npx playwright test tests/e2e/suites/dashboard/participants.spec.ts

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run tests with debug mode
npx playwright test --debug
```

### Visual Regression Testing

The system includes a comprehensive visual snapshot system. See [VISUAL_TESTING.md](./docs/VISUAL_TESTING.md) for detailed documentation.

**Important**: Visual snapshots must be generated using Docker to match CI (Linux environment).

```bash
# Generate/update baseline screenshots using Docker (recommended)
pnpm test:e2e:update-snapshots

# Run visual regression tests
npx playwright test --grep "visual snapshot"
```

## Directory Structure

```
tests/e2e/
├── docs/               # Documentation
│   ├── DATABASE_SNAPSHOTS.md
│   └── VISUAL_TESTING.md
├── fixtures/           # Reusable test utilities
│   ├── database-snapshots.ts
│   ├── page-helpers.ts
│   ├── test-data-builder.ts
│   ├── test-environment.ts
│   ├── test.ts         # Main test fixture with visual snapshots, auth & database
│   └── visual-snapshots.ts
├── scripts/           # Utility scripts
│   └── generate-baselines.sh
├── suites/            # Test suites organized by area
│   ├── auth/
│   ├── dashboard/
│   ├── interview/
│   └── setup/
├── types/             # TypeScript type definitions
│   └── global.d.ts
├── global-setup.ts    # Global test setup
├── global-teardown.ts # Global test cleanup
└── playwright.config.ts # Playwright configuration
```

## Test Organization

Tests are organized into logical suites:

- **Auth**: Authentication flow tests
- **Dashboard**: Admin dashboard functionality
- **Interview**: Interview experience tests
- **Setup**: Initial application setup tests

Each suite can run independently with appropriate database seeding and environment setup.

## Key Features

### 🎯 Visual Regression Testing

- **Integrated fixture system**: `snapshots` available in every test automatically
- Comprehensive snapshot system with configurable options
- Automatic handling of dynamic content and animations
- Predefined configurations for common UI patterns
- Easy baseline generation and management

### 🔐 Authentication System

- **Integrated fixture system**: `authenticatedPage` available when needed
- Persistent authentication state between tests
- Admin and participant authentication flows
- Automatic session management

### 🗄️ Database Management

- **Integrated fixture system**: `database` available for snapshot operations
- **Context-aware**: Automatically detects the correct database context per test suite
- Isolated test environments per suite (setup, dashboard, interviews)
- Automatic seeding with realistic test data
- Snapshot and restore capabilities for state management
- Direct Prisma client access for database operations

### 🐳 Test Architecture

The e2e tests use a hybrid architecture:

- **PostgreSQL databases**: Provisioned via [testcontainers](https://testcontainers.com/) (requires Docker)
- **Next.js app**: Runs as native Node.js processes from the standalone build
- **Visual snapshots**: Generated in Docker (Playwright image) to match CI environment

This approach provides:

- Fast test startup (no Docker image build for the app)
- Isolated databases per test suite (setup, dashboard, interviews)
- Consistent snapshot generation across platforms

### 📊 Comprehensive Coverage

- Parallel and serial test execution strategies
- Both functional and visual regression testing
- Cross-browser testing support

## Configuration

The system uses several configuration files:

- `playwright.config.ts`: Main Playwright configuration
- `config/test-config.ts`: Test-specific settings and credentials
- `global.d.ts`: TypeScript global type definitions

## Prerequisites

- **Docker**: Required for PostgreSQL containers (testcontainers) and visual snapshot generation
- **Node.js 20+**: As specified in `.nvmrc`
- **pnpm**: Package manager

## Environment Variables

Key environment variables (automatically managed):

- `SETUP_URL`, `DASHBOARD_URL`, `INTERVIEW_URL`: Generated test environment URLs
- `CI`: Enables CI-specific optimizations
- `FORCE_REBUILD`: Set to `true` to force a fresh Next.js build before tests

## Best Practices

### Test Writing

- Use descriptive test names that explain the expected behavior
- Leverage the integrated fixture system for visual testing and authentication
- Wait for stability before assertions, especially for visual tests
- Use semantic selectors (roles, labels) over CSS selectors when possible

```typescript
// Import the integrated test fixture
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/test';

test('page functionality and visuals', async ({ page, snapshots }) => {
  await page.goto('/my-page');

  // Test functionality first
  await expect(page.getByRole('heading')).toBeVisible();

  // Then test visual appearance
  await snapshots.waitForStablePage();
  await snapshots.expectPageToMatchSnapshot(SNAPSHOT_CONFIGS.page('my-page'));
});

// For tests that need authentication
test('admin functionality', async ({ authenticatedPage, snapshots }) => {
  await authenticatedPage.goto('/admin');
  // Test authenticated functionality...
});

// For tests that need database isolation
test('database mutations with isolation', async ({ database }) => {
  const cleanup = await database.isolate('test-state');

  // Make database changes
  await database.prisma.participant.deleteMany();

  // Test with modified state
  const count = await database.prisma.participant.count();
  expect(count).toBe(0);

  // Restore original state
  await cleanup();
});
```

### Visual Testing

- Always use the visual snapshot system for consistency
- Generate baselines deliberately and review them carefully
- Use appropriate configurations for different UI patterns
- Mask dynamic content that shouldn't affect visual validation

### Database Testing

- Use the integrated `database` fixture for state management
- Create snapshots before mutations to enable rollback
- Use `isolate()` for automatic cleanup in serial tests
- Access Prisma client directly via `database.prisma`
- See [DATABASE_SNAPSHOTS.md](./docs/DATABASE_SNAPSHOTS.md) for comprehensive guidance

### Debugging

- Use `--headed` mode to see tests running in real browsers
- Use `--debug` mode to step through tests interactively
- Check the `test-results/` directory for failure artifacts
- Review the HTML report generated after test runs

## Troubleshooting

### Common Issues

**Tests timing out**: Increase timeouts in `playwright.config.ts` or use more specific waits

**Visual tests failing**: Check if UI changes are intentional, then update baselines with `--update-snapshots`

**Database connection errors**: Ensure Docker is running and containers are healthy

**Authentication failures**: Check test credentials in `config/test-config.ts`

### Getting Help

1. Check the logs in `test-results/` for detailed error information
2. Run tests with `--reporter=line` for more verbose output
3. Use `--debug` mode to step through failing tests
4. Review the documentation in the `docs/` directory

For visual regression testing specifically, see [VISUAL_TESTING.md](./docs/VISUAL_TESTING.md) for comprehensive guidance.
