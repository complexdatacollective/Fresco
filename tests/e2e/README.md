# E2E Testing System

This directory contains the end-to-end testing system for Fresco, including comprehensive test suites, fixtures, and utilities.

## Quick Start

### Running Tests

All e2e tests run inside a Docker container (the official Playwright image) to ensure consistent visual snapshots across all environments. This matches the CI environment exactly.

```bash
# Run all e2e tests (in Docker)
pnpm test:e2e

# Run specific test suite
pnpm test:e2e tests/e2e/suites/dashboard/participants.spec.ts

# Run with specific Playwright options
pnpm test:e2e --project=dashboard
pnpm test:e2e --grep "visual snapshot"

# Force rebuild the Next.js standalone build
FORCE_REBUILD=true pnpm test:e2e
```

### Local Development (Native)

For debugging and development, you can run tests natively on your machine. Note that visual snapshots may differ from CI when running locally due to OS-specific font rendering.

```bash
# Run tests locally (without Docker)
pnpm test:e2e:local

# Run with Playwright UI for debugging
pnpm test:e2e:local:ui

# Run in step-through debug mode
pnpm test:e2e:local:debug
```

### Visual Regression Testing

The system includes a comprehensive visual snapshot system. See [VISUAL_TESTING.md](./docs/VISUAL_TESTING.md) for detailed documentation.

Visual snapshots are always generated using the Linux Playwright Docker image to match CI.

```bash
# Generate/update baseline screenshots
pnpm test:e2e:update-snapshots

# Run visual regression tests
pnpm test:e2e --grep "visual snapshot"
```

## Directory Structure

```
tests/e2e/
├── docs/               # Documentation
│   ├── DATABASE_SNAPSHOTS.md
│   └── VISUAL_TESTING.md
├── fixtures/           # Reusable test utilities
│   ├── context-resolver.ts     # Worker process context resolution
│   ├── context-storage.ts      # Serializes context for worker processes
│   ├── fixtures.ts             # Main test fixture with visual snapshots & database
│   ├── native-app-environment.ts # Next.js process management
│   ├── snapshot-client.ts      # Test fixture for database isolation (HTTP client)
│   ├── snapshot-server.ts      # HTTP server for snapshot/restore coordination
│   ├── test-data-builder.ts    # Test data creation utilities
│   ├── test-environment.ts     # PostgreSQL container management
│   └── visual-snapshots.ts     # Visual regression testing utilities
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
- **Container-level snapshots**: Uses testcontainers to capture and restore entire PostgreSQL state
- **Automatic Next.js restart**: Restoring a snapshot also restarts Next.js for clean connections
- **Context-aware**: Automatically detects the correct database context per test suite
- Isolated test environments per suite (setup, dashboard, interviews)
- Automatic seeding with realistic test data
- Direct Prisma client access for database operations

### 🐳 Test Architecture

The e2e tests use a hybrid architecture:

- **PostgreSQL databases**: Provisioned via [testcontainers](https://testcontainers.com/) (requires Docker)
- **Next.js app**: Runs as native Node.js processes from the standalone build
- **Snapshot server**: HTTP server in global setup that coordinates database snapshots and Next.js restarts
- **Visual snapshots**: Generated in Docker (Playwright image) to match CI environment

This approach provides:

- Fast test startup (no Docker image build for the app)
- Isolated databases per test suite (setup, dashboard, interviews)
- Container-level database snapshots with automatic Next.js restart
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
import { expect, test, SNAPSHOT_CONFIGS } from '../../fixtures/fixtures';

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

- Use `pnpm test:e2e:local:ui` for the interactive Playwright UI
- Use `pnpm test:e2e:local:debug` to step through tests interactively
- Use `pnpm test:e2e:local --headed` to see tests running in real browsers
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
