# Playwright E2E Testing System

This document describes the end-to-end testing system implemented for Fresco using Playwright, Docker, and parallel execution capabilities.

## Overview

The testing system provides:
- 🐳 **Containerized Testing**: Fully isolated test environment using Docker
- 🚀 **Parallel Execution**: Run multiple test suites simultaneously
- 📸 **Visual Regression Testing**: Screenshot comparison capabilities
- 🔄 **CI/CD Ready**: Designed for integration with GitHub Actions or other CI systems
- 🎯 **Test Categories**: Organized tests for auth, dashboard, and interview flows

## Quick Start

### Local Development

1. **Install Playwright locally**:
   ```bash
   pnpm playwright:install
   ```

2. **Run tests locally** (requires dev server running):
   ```bash
   pnpm test:e2e           # Run all tests
   pnpm test:e2e:ui        # Run with UI mode
   pnpm test:e2e:debug     # Debug mode
   pnpm test:e2e:headed    # Run in headed mode (see browser)
   ```

### Docker Testing

1. **Run tests in Docker** (fully isolated):
   ```bash
   pnpm test:e2e:docker    # Run all tests in Docker
   pnpm test:e2e:docker:down  # Clean up containers
   ```

2. **Parallel execution**:
   ```bash
   pnpm test:e2e:parallel           # Run test suites in parallel
   pnpm test:e2e:parallel:browsers  # Run all browsers in parallel
   pnpm test:e2e:parallel:all       # Run everything in parallel (resource intensive)
   ```

## Architecture

### File Structure

```
tests/
├── e2e/
│   ├── __screenshots__/        # Visual regression baselines
│   ├── auth/                   # Authentication tests
│   │   └── login.spec.ts
│   ├── dashboard/              # Dashboard tests
│   │   └── protocols.spec.ts
│   ├── interview/              # Interview flow tests
│   │   └── interview-flow.spec.ts
│   ├── fixtures/               # Test fixtures and custom test setup
│   │   └── test-fixtures.ts
│   ├── helpers/                # Page objects and utilities
│   │   └── page-objects.ts
│   ├── global-setup.ts         # Global test setup
│   ├── global-teardown.ts      # Global test teardown
│   └── example.spec.ts         # Example test file
```

### Docker Setup

- **Dockerfile.nextjs**: Production-ready Next.js container with health checks
- **Dockerfile.playwright**: Playwright test runner with all browser dependencies
- **docker-compose.test.yml**: Complete test environment with database, app, and test runner

### Configuration Files

- **playwright.config.ts**: Standard Playwright configuration
- **playwright.config.parallel.ts**: Configuration for parallel test execution

## Test Categories

### Authentication Tests (`auth/`)
- Login functionality
- Logout functionality
- Error handling
- Form validation
- Visual regression

### Dashboard Tests (`dashboard/`)
- Protocol management
- Upload functionality
- Statistics display
- CRUD operations
- Visual regression

### Interview Tests (`interview/`)
- Interview flow navigation
- Node creation
- Edge connections
- Data persistence
- Stage transitions
- Visual regression

## Writing Tests

### Using Test Fixtures

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('example test', async ({ page, apiHelper, testUser }) => {
  // Reset database
  await apiHelper.resetDatabase();
  
  // Create test data
  await apiHelper.createUser();
  await apiHelper.createProtocol({ name: 'Test Protocol' });
  
  // Use test user credentials
  await page.fill('[name="username"]', testUser.username);
});
```

### Using Page Objects

```typescript
import { LoginPage, DashboardPage } from '../helpers/page-objects';

test('login and navigate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  
  await loginPage.login('user@example.com', 'password');
  await dashboardPage.navigateToDashboard();
});
```

### Visual Regression Testing

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot and compare with baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

## API Test Endpoints

The system includes test-specific API endpoints (only available in test/development mode):

### `/api/health`
Health check endpoint for container readiness.

### `/api/test/seed`
Test data management endpoint:
- `POST` with `action: 'reset'` - Clear database
- `POST` with `action: 'createUser'` - Create test user
- `POST` with `action: 'createProtocol'` - Create test protocol
- `POST` with `action: 'createInterview'` - Create test interview
- `DELETE` - Clear all test data

## Parallel Execution

The parallel test runner (`scripts/run-parallel-tests.sh`) supports different modes:

### Suite Parallel Mode
Runs different test suites (auth, dashboard, interview) in parallel:
```bash
./scripts/run-parallel-tests.sh --mode suites
```

### Browser Parallel Mode
Runs tests across all browsers in parallel:
```bash
./scripts/run-parallel-tests.sh --mode browsers
```

### Full Parallel Mode
Runs all combinations in parallel (resource intensive):
```bash
./scripts/run-parallel-tests.sh --mode all
```

### Options
- `--no-build` - Skip Docker image building
- `--no-cleanup` - Don't cleanup containers after tests

## Environment Variables

### Test Environment
- `NODE_ENV=test` - Enable test endpoints
- `CI=true` - CI environment flag
- `BASE_URL` - Application URL for tests
- `SKIP_WEBSERVER` - Skip starting dev server in Docker

### Parallel Execution
- `TEST_SUITE` - Test suite to run (auth, dashboard, interview)
- `TEST_BROWSER` - Browser to use (chromium, firefox, webkit)
- `PARALLEL_WORKERS` - Number of parallel workers per pod

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run E2E Tests
        run: |
          docker compose -f docker-compose.test.yml up \
            --build \
            --abort-on-container-exit \
            --exit-code-from playwright_runner
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging

### View Test Reports
After running tests, reports are available in:
- `playwright-report/` - HTML report
- `test-results/` - JSON and JUnit reports
- `tests/e2e/__screenshots__/` - Visual regression screenshots

### Debug Failed Tests
1. Run with `--debug` flag locally
2. Check container logs: `docker logs fresco-playwright`
3. View screenshots in test results
4. Use Playwright trace viewer for detailed debugging

### Common Issues

**Tests fail with "Application not responding"**
- Ensure Docker is running
- Check if ports 3000 (app) and 5433 (database) are available
- Verify health check endpoint is working

**Visual regression failures**
- Update baselines: `npx playwright test --update-snapshots`
- Ensure consistent viewport sizes
- Disable animations in tests

**Parallel execution resource issues**
- Reduce worker count with `PARALLEL_WORKERS` env var
- Use `--mode suites` instead of `--mode all`
- Ensure sufficient system resources (CPU, RAM)

## Best Practices

1. **Reset database before each test** to ensure isolation
2. **Use page objects** for maintainable tests
3. **Keep tests independent** - don't rely on execution order
4. **Use meaningful test descriptions** for better reporting
5. **Implement proper cleanup** in test teardown
6. **Use visual regression sparingly** - only for critical UI
7. **Mock external services** when possible
8. **Keep test data minimal** but realistic

## Maintenance

### Updating Browser Versions
```bash
# Update Playwright and browsers
pnpm add -D @playwright/test@latest
pnpm playwright:install
```

### Updating Docker Images
```bash
# Rebuild containers
docker compose -f docker-compose.test.yml build --no-cache
```

### Cleaning Up
```bash
# Remove all test containers and volumes
docker compose -f docker-compose.test.yml down -v

# Remove test artifacts
rm -rf playwright-report test-results tests/e2e/__screenshots__
```

## Contributing

When adding new tests:
1. Place tests in appropriate category folder
2. Use existing fixtures and page objects
3. Add visual regression tests for critical UI
4. Update this documentation if adding new patterns
5. Ensure tests pass in Docker before committing