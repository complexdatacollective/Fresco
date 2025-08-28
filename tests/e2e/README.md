# Fresco E2E Testing with Playwright

This directory contains end-to-end tests for the Fresco dashboard using Playwright.

## Test Structure

```
tests/e2e/
├── dashboard/          # Dashboard-specific tests
│   ├── dashboard-home.spec.ts    # Home dashboard tests
│   ├── protocols.spec.ts         # Protocols page tests
│   ├── participants.spec.ts      # Participants page tests
│   ├── interviews.spec.ts        # Interviews page tests
│   ├── settings.spec.ts          # Settings page tests
│   └── smoke.spec.ts             # Smoke tests across all pages
├── utils/              # Test utilities and helpers
│   ├── auth-helper.ts            # Authentication helper
│   ├── test-helpers.ts           # Generic test utilities
│   └── dashboard-helpers.ts      # Dashboard-specific helpers
├── .auth/              # Authentication storage
│   └── user.json                 # Saved authentication state
├── auth.setup.ts       # Authentication setup for tests
├── global-setup.ts     # Global test setup
└── global-teardown.ts  # Global test cleanup
```

## Features

### Authentication
- Automatic authentication setup using `auth.setup.ts`
- Reuses authentication state across tests for better performance
- Helper functions for login/logout scenarios

### Visual Regression Testing
- Full page screenshots for visual comparison
- Component-level screenshots for targeted testing
- Dynamic content masking (timestamps, IDs, etc.)
- Responsive design testing across multiple viewports

### Dashboard Coverage
- **Dashboard Home**: Summary statistics, activity feed, navigation
- **Protocols**: Protocol management, upload functionality, table views
- **Participants**: Participant management, import/export, CRUD operations
- **Interviews**: Interview data, export functionality, network summaries
- **Settings**: Configuration management, form validation

## Running Tests

### Prerequisites
1. Ensure the development server is running (`pnpm dev`)
2. Ensure test database is set up and accessible

### Available Commands

```bash
# Run all e2e tests
pnpm test:e2e

# Run with UI (interactive mode)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run only dashboard tests
pnpm test:e2e:dashboard

# Run smoke tests only
pnpm test:e2e:smoke

# Run visual regression tests
pnpm test:visual

# Update visual regression baselines
pnpm test:visual:update
```

### Test Environment

Tests run with the following environment:
- `NODE_ENV=test`
- Test database (separate from development)
- Analytics disabled
- Environment validation skipped

Configuration is loaded from `.env.test`.

## Test Patterns

### Authentication
```typescript
// Tests automatically use saved authentication state
// No need to login in each test

// For custom auth scenarios:
const authHelper = new AuthHelper(page);
await authHelper.login('username', 'password');
```

### Visual Regression
```typescript
const dashboardHelpers = new DashboardHelpers(page);

// Prepare page for consistent screenshots
await dashboardHelpers.prepareForVisualTesting();

// Full page screenshot
await dashboardHelpers.expectVisualRegression('test-name');

// Component screenshot
await dashboardHelpers.expectElementVisualRegression(
  '[data-testid="component"]',
  'component-name'
);
```

### Responsive Testing
```typescript
// Test multiple viewports
const viewports = [
  { width: 1920, height: 1080 }, // Desktop
  { width: 768, height: 1024 },  // Tablet
  { width: 375, height: 667 }    // Mobile
];

for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  // ... test responsive behavior
}
```

## CI/CD Integration

Tests are configured to run in GitHub Actions with:
- Automatic browser installation
- Artifact collection for test reports and screenshots
- Parallel execution for faster feedback
- Visual regression comparison

## Best Practices

1. **Test Structure**: Each page has its own spec file with comprehensive coverage
2. **Reusable Helpers**: Common functionality is abstracted into helper classes
3. **Visual Stability**: Dynamic content is masked or hidden for consistent screenshots
4. **Performance**: Authentication state is reused, avoiding repeated logins
5. **Accessibility**: Basic accessibility checks are included in smoke tests
6. **Error Handling**: Tests gracefully handle missing data/empty states

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Check that test user exists and credentials are correct
2. **Visual Regression Failures**: Review screenshots in `test-results/` directory
3. **Timeout Issues**: Increase timeout for slow-loading components
4. **Database Issues**: Ensure test database is accessible and seeded

### Debugging

```bash
# Run with debug output
DEBUG=pw:api pnpm test:e2e

# Run single test in headed mode
pnpm test:e2e:headed --grep "specific test name"

# Generate trace files
pnpm test:e2e --trace on
```

### Visual Baseline Updates

When UI changes are intentional, update visual baselines:
```bash
pnpm test:visual:update
```

Review the generated screenshots before committing to ensure they're correct.