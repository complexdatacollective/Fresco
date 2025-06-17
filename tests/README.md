# Fresco E2E Testing Guide

This directory contains end-to-end tests for the Fresco application using Playwright.

## Getting Started

1. **Setup test environment**:
   ```bash
   pnpm run test:e2e:setup
   ```

2. **Run all tests**:
   ```bash
   pnpm run test:e2e
   ```

3. **Run tests with UI mode**:
   ```bash
   pnpm run test:e2e:ui
   ```

4. **Debug tests**:
   ```bash
   pnpm run test:e2e:debug
   ```

5. **View test report**:
   ```bash
   pnpm run test:e2e:report
   ```

## Directory Structure

- `/fixtures` - Test fixtures and custom test configurations
- `/page-objects` - Page Object Models for different pages
- `/test-data` - Static test data and factories
- `/utils` - Test utilities and helper functions

## Test Categories

- `smoke.spec.ts` - Basic smoke tests
- `dashboard/` - Dashboard functionality tests
- `setup/` - Setup and onboarding tests
- `auth/` - Authentication tests
- `visual/` - Visual regression tests

## Best Practices

1. Use Page Object Models for reusable page interactions
2. Keep tests independent and isolated
3. Use descriptive test names and organize with describe blocks
4. Clean up test data after each test
5. Use visual snapshots for UI regression testing

## Troubleshooting

- If tests fail to connect to database, run `pnpm run test:e2e:setup`
- If browser issues occur, run `pnpm exec playwright install`
- Check test reports in `tests/e2e/playwright-report/`