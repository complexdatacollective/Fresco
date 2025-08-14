# Dashboard Functional Tests

This directory contains Phase A functional tests for the dashboard interface.

## Overview

Functional tests focus on testing complete user workflows and business scenarios rather than individual components. They use the Page Object Model pattern with the `BaseDashboardPage` class to provide consistent interactions across tests.

## Directory Structure

```
tests/e2e/functional/dashboard/
├── README.md                    # This file
├── config.ts                    # Test configuration and constants
├── sample.functional.spec.ts    # Sample test demonstrating infrastructure
└── [future test files]          # Specific functional test suites
```

## Test Infrastructure

### BaseDashboardPage Class

Located at `tests/e2e/pages/dashboard/BaseDashboardPage.ts`, this provides:

- **Navigation methods**: Navigate between dashboard sections
- **Authentication handling**: Verify and maintain login state
- **Element interactions**: Click, fill, wait for elements
- **Wait methods**: Wait for loading, stability, specific conditions
- **Error handling**: Handle dialogs, errors, retries
- **Screenshot capabilities**: Take full page or element screenshots

### Functional Test Fixtures

Located at `tests/e2e/fixtures/functional.ts`, provides:

- **Extended timeouts**: 30s default for complex interactions
- **Page stability**: Wait for network idle, animations complete
- **Request logging**: Debug API calls and responses
- **Error handling**: Capture and log page errors
- **Multiple viewport support**: Test on different screen sizes

## Usage

### Basic Test Structure

```typescript
import { test, expect } from '~/tests/e2e/fixtures/functional';

test.describe('Dashboard Feature Tests', () => {
  test.beforeEach(async ({ dashboardData, setupFunctionalTest }) => {
    void dashboardData; // Ensure test data is loaded
    await setupFunctionalTest();
  });

  test('should complete user workflow', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to page
    await dashboardPage.goto();
    await waitForPageStability();

    // Perform actions
    await dashboardPage.navigateToParticipants();
    await waitForPageStability();

    // Verify results
    await dashboardPage.verifyPageLoaded();
  });
});
```

### Page Object Usage

```typescript
// Navigate between sections
await dashboardPage.navigateToParticipants();
await dashboardPage.navigateToProtocols();
await dashboardPage.navigateToInterviews();

// Form interactions
await dashboardPage.fillFormField('name', 'Test Participant');
await dashboardPage.submitForm();

// Table interactions
await dashboardPage.searchInTable('test query');
const rowCount = await dashboardPage.getTableRowCount();

// Wait for conditions
await dashboardPage.waitForLoadingToComplete();
await dashboardPage.waitForSuccessMessage();
```

## Test Data

### Participants Data

Located in `tests/e2e/test-data/participants/`:

- `csv/sample-participants-small.csv` - Small dataset for testing
- `json/participant-data.json` - Structured participant data

### Files Data

Located in `tests/e2e/test-data/files/`:

- `protocols/` - Protocol files (.netcanvas format)
- `assets/` - Image and asset files
- `exports/` - Sample export files
- `csv/` - CSV files for import testing

## Configuration

The `config.ts` file contains:

- **Timeouts**: Default timeouts for different operations
- **Viewports**: Standard screen sizes for responsive testing
- **Selectors**: Standardized data-testid values
- **Test scenarios**: Common test data and scenarios
- **Performance thresholds**: Expected performance metrics

## Running Tests

```bash
# Run all functional tests
npx playwright test tests/e2e/functional/dashboard/

# Run specific test file
npx playwright test tests/e2e/functional/dashboard/sample.functional.spec.ts

# Run with specific browser
npx playwright test tests/e2e/functional/dashboard/ --browser=chromium

# Run with debug mode
npx playwright test tests/e2e/functional/dashboard/ --debug

# Run with UI mode
npx playwright test tests/e2e/functional/dashboard/ --ui
```

## Best Practices

### Test Organization

1. **One workflow per test**: Each test should focus on a single user journey
2. **Use descriptive names**: Test names should clearly describe the scenario
3. **Group related tests**: Use `test.describe` to group related functionality
4. **Setup/teardown**: Use `beforeEach`/`afterEach` for consistent state

### Page Object Usage

1. **Use the base class**: Extend `BaseDashboardPage` for specific pages
2. **Consistent selectors**: Use data-testid attributes for reliability
3. **Wait for stability**: Always wait for page stability before interactions
4. **Handle errors gracefully**: Use try/catch for optional elements

### Data Management

1. **Use test data files**: Don't hardcode test data in tests
2. **Clean state**: Ensure tests don't interfere with each other
3. **Realistic data**: Use realistic but fake data for testing
4. **Edge cases**: Include invalid data scenarios

### Performance

1. **Minimize waits**: Use specific waits rather than arbitrary timeouts
2. **Parallel execution**: Design tests to run in parallel
3. **Resource cleanup**: Clean up any resources created during tests
4. **Monitor performance**: Track test execution times

## Troubleshooting

### Common Issues

1. **Element not found**: Ensure correct data-testid attributes
2. **Timeout errors**: Check if loading states are properly handled
3. **Authentication issues**: Verify auth fixtures are working
4. **Data inconsistency**: Ensure test data is properly seeded

### Debug Tips

1. **Use screenshots**: Take screenshots at failure points
2. **Console logging**: Check browser console for errors
3. **Network tab**: Monitor API requests and responses
4. **Slow motion**: Use `--slowmo` flag for debugging
5. **Headed mode**: Use `--headed` to see browser interactions

## Future Enhancements

1. **Specific page classes**: Create specialized page classes for each section
2. **API utilities**: Add utilities for direct API testing
3. **Visual regression**: Integrate visual comparison testing
4. **Mobile testing**: Add mobile-specific test scenarios
5. **Performance monitoring**: Add performance assertion utilities
