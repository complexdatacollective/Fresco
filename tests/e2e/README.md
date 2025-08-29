# End-to-End Testing for Fresco

This directory contains comprehensive end-to-end tests for the Fresco application using Playwright and Testcontainers.

## Architecture

The e2e testing setup uses Testcontainers to create isolated Docker environments for each test suite, ensuring:
- Complete isolation between test suites
- Parallel execution of test suites
- Reproducible test environments
- No pollution between tests

### Key Components

1. **Test Environment Manager** (`fixtures/test-environment.ts`)
   - Manages Docker containers for PostgreSQL and the Fresco application
   - Handles Prisma migrations and database seeding
   - Provides cleanup mechanisms

2. **Database Manager** (`fixtures/database-manager.ts`)
   - Manages database snapshots for test restoration
   - Provides utilities for database operations
   - Integrates with Prisma ORM

3. **Test Data Builder** (`fixtures/test-data-builder.ts`)
   - Creates test data using Prisma
   - Provides factory methods for all domain entities
   - Ensures consistent test data across suites

4. **Page Helpers** (`fixtures/page-helpers.ts`)
   - Common UI interaction helpers
   - Reduces code duplication in tests
   - Provides consistent test patterns

## Test Suites

### Setup Suite (`suites/setup/`)
Tests the initial application setup and configuration flow.
- First-time setup
- Admin account creation
- Initial configuration

### Protocols Suite (`suites/protocols/`)
Tests protocol management functionality.
- Protocol import/export
- Protocol listing and search
- Protocol deletion
- Asset management

### Interviews Suite (`suites/interviews/`)
Tests the interview workflow.
- Starting interviews
- Interview navigation
- Data collection
- Interview completion
- Data export

### Participants Suite (`suites/participants/`)
Tests participant management.
- Participant creation
- Participant search
- Bulk operations
- Interview history

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
pnpm install
pnpm add -D @playwright/test @testcontainers/postgresql testcontainers wait-on
```

2. Install Playwright browsers:
```bash
pnpm playwright install
```

3. Ensure Docker is running:
```bash
docker --version
```

### Running All Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug
```

### Running Specific Test Suites

```bash
# Run only setup tests
pnpm test:e2e --project=setup

# Run only protocol tests
pnpm test:e2e --project=protocols

# Run only interview tests
pnpm test:e2e --project=interviews

# Run only participant tests
pnpm test:e2e --project=participants
```

### Running in CI

```bash
# Build test image first, then run tests
pnpm test:e2e:ci
```

## Test Data

### Seed Files

- `seeds/base-seed.sql` - Minimal seed data for testing
- `seeds/complex-seed.ts` - TypeScript seed with complex test scenarios

### Test Users

Default test users created by seeds:
- Username: `admin`, Password: `AdminPass123!`
- Username: `testuser`, Password: `TestPassword123!`

## Development

### Adding New Tests

1. Create a new test file in the appropriate suite directory
2. Import page helpers for common operations
3. Use the test data builder for consistent data
4. Follow the existing test patterns

Example:
```typescript
import { test, expect } from '@playwright/test';
import { createPageHelpers } from '../../fixtures/page-helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const helpers = createPageHelpers(page);
    await helpers.login('admin', 'AdminPass123!');
    
    // Your test logic here
  });
});
```

### Creating New Test Suites

1. Add a new directory under `suites/`
2. Update `playwright.config.ts` to add the new project
3. Update `global-setup.ts` to create the test environment
4. Create test files in the new directory

### Debugging Failed Tests

1. **View test report:**
   ```bash
   pnpm playwright show-report
   ```

2. **Check screenshots:**
   Failed tests automatically capture screenshots in `test-results/`

3. **View traces:**
   ```bash
   pnpm playwright show-trace path/to/trace.zip
   ```

4. **Run specific test in headed mode:**
   ```bash
   pnpm playwright test path/to/test.spec.ts --headed
   ```

## Best Practices

1. **Test Isolation:** Each test should be independent and not rely on other tests
2. **Use Page Helpers:** Leverage the page helpers for common operations
3. **Meaningful Assertions:** Write clear, specific assertions
4. **Cleanup:** Always ensure proper cleanup in test teardown
5. **Descriptive Names:** Use descriptive test and suite names
6. **Avoid Hard Waits:** Use Playwright's built-in waiting mechanisms
7. **Data Builders:** Use the test data builder for consistent test data

## Troubleshooting

### Container Issues

If containers fail to start:
```bash
# Check Docker status
docker ps -a

# View container logs
docker logs <container-id>

# Clean up orphaned containers
docker system prune -a
```

### Port Conflicts

If you get port binding errors:
```bash
# Find processes using ports
lsof -i :3000
lsof -i :5432

# Kill conflicting processes
kill -9 <PID>
```

### Database Migration Issues

If migrations fail:
```bash
# Run migrations manually
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset
```

### Test Timeout Issues

Increase timeouts in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 30000,
  navigationTimeout: 60000,
}
```

## Environment Variables

The test environment automatically sets:
- `NODE_ENV=test`
- `POSTGRES_*` variables for database connection
- `SKIP_ENV_VALIDATION=true` for testing

Custom environment variables can be added in the test setup:
```typescript
environmentVariables: {
  CUSTOM_VAR: 'value',
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Contributing

When contributing to e2e tests:
1. Ensure tests pass locally before pushing
2. Add appropriate test coverage for new features
3. Update this README if adding new patterns or suites
4. Follow the existing code style and patterns
