# Database Snapshot Testing Guide

This guide explains how to use the database snapshot system for test isolation and state management in the Fresco e2e test suite.

## Overview

Database snapshots provide a way to capture and restore the database state during tests, enabling:

- **Test isolation**: Each test can start with a clean, known database state
- **State management**: Revert mutations made during serial tests
- **Performance**: Faster than recreating test data for each test
- **Consistency**: Reliable test execution with predictable data states
- **Context-aware**: Automatically detects the appropriate database context for your test suite

## Context Detection

The database fixture automatically determines which test environment context to use based on:

1. **Test file path**: `/suites/dashboard/` → dashboard context
2. **Playwright project name**: `dashboard` → dashboard context
3. **Base URL matching**: Matches the context with the same app URL
4. **Fallback**: Uses interviews context (most feature-rich) as default

Available contexts:

- **setup**: Minimal environment for initial app setup tests
- **dashboard**: Admin environment with basic protocols and users
- **interviews**: Full environment with participants, interviews, and rich test data

## Quick Start

### 1. Import the Test Framework

```typescript
import { expect, test } from '../../fixtures/test';
```

### 2. Basic Usage

The `database` fixture is automatically available in every test:

```typescript
test('should handle database operations', async ({ database }) => {
  // Create a snapshot before making changes
  await database.create('before-changes');

  // Make some database mutations...
  await database.prisma.participant.create({
    data: { identifier: 'TEST001', label: 'Test User' },
  });

  // Restore to the previous state
  await database.restore('before-changes');

  // Verify the changes were reverted
  const participant = await database.prisma.participant.findFirst({
    where: { identifier: 'TEST001' },
  });
  expect(participant).toBeNull();
});
```

## Core Functionality

### Creating Snapshots

```typescript
// Create a named snapshot
await database.create('my-snapshot');

// Create an automatic snapshot (timestamped)
await database.create();
```

### Restoring Snapshots

```typescript
// Restore a named snapshot
await database.restore('my-snapshot');

// Restore the most recent snapshot
await database.restore();
```

### Test Isolation Pattern

For serial tests that need complete isolation:

```typescript
test.describe.serial('Mutating tests with isolation', () => {
  test('first test with isolation', async ({ database }) => {
    // Create isolation snapshot and get cleanup function
    const cleanup = await database.isolate('test1-start');

    // Make database changes...
    await database.prisma.participant.deleteMany();

    // Cleanup will restore the snapshot automatically
    await cleanup();
  });

  test('second test sees clean state', async ({ database }) => {
    // Database is back to initial state
    const participants = await database.prisma.participant.findMany();
    expect(participants.length).toBeGreaterThan(0);
  });
});
```

### Scoped Operations

For tests that need temporary changes within a specific scope:

```typescript
test('should handle scoped database changes', async ({ database }) => {
  const result = await database.withSnapshot('scoped-changes', async () => {
    // Make changes inside this scope
    await database.prisma.participant.deleteMany();
    await database.prisma.participant.create({
      data: { identifier: 'TEMP001', label: 'Temporary User' },
    });

    // Do some testing with the modified state
    const count = await database.prisma.participant.count();
    return count;
  });

  // After the scope, database is automatically restored
  expect(result).toBe(1); // Only our temporary participant

  // Verify restoration
  const originalCount = await database.prisma.participant.count();
  expect(originalCount).toBeGreaterThan(1); // Back to original state
});
```

## Direct Prisma Access

Access the Prisma client for direct database operations:

```typescript
test('should query database directly', async ({ database }) => {
  // Direct Prisma access
  const participants = await database.prisma.participant.findMany({
    where: { identifier: { startsWith: 'P0' } },
    include: { interviews: true },
  });

  expect(participants.length).toBeGreaterThan(0);
});
```

## Test Hooks Integration

### beforeEach and afterEach

```typescript
test.describe('Tests with automatic snapshots', () => {
  let cleanup: (() => Promise<void>) | undefined;

  test.beforeEach(async ({ database }) => {
    // Create snapshot before each test
    cleanup = await database.isolate(`test-${test.info().title}`);
  });

  test.afterEach(async () => {
    // Restore after each test
    if (cleanup) {
      await cleanup();
    }
  });

  test('first test', async ({ database }) => {
    // Make changes - will be reverted automatically
    await database.prisma.participant.deleteMany();
  });

  test('second test', async ({ database }) => {
    // Starts with clean state
    const participants = await database.prisma.participant.findMany();
    expect(participants.length).toBeGreaterThan(0);
  });
});
```

### Shared Setup and Teardown

```typescript
test.describe('Suite with shared snapshots', () => {
  test.beforeAll(async ({ database }) => {
    // Create shared setup
    await database.create('suite-start');

    // Add suite-specific test data
    await database.prisma.participant.create({
      data: { identifier: 'SUITE001', label: 'Suite Test User' },
    });
  });

  test.afterAll(async ({ database }) => {
    // Restore to pre-suite state
    await database.restore('suite-start');
  });

  test('uses shared setup', async ({ database }) => {
    const suiteUser = await database.prisma.participant.findFirst({
      where: { identifier: 'SUITE001' },
    });
    expect(suiteUser).toBeTruthy();
  });
});
```

## Best Practices

### 1. Naming Conventions

Use descriptive snapshot names that indicate the test state:

```typescript
// Good
await database.create('participants-loaded');
await database.create('before-bulk-delete');
await database.create('after-csv-import');

// Avoid
await database.create('test1');
await database.create('snapshot');
```

### 2. Test Organization

```typescript
test.describe('Participants Management', () => {
  // Parallel tests - read-only, no snapshots needed
  test.describe.parallel('Read Operations', () => {
    test('should display participants', async ({ page }) => {
      // No database changes, no snapshots needed
    });
  });

  // Serial tests - mutations, use snapshots
  test.describe.serial('Write Operations', () => {
    test('should add participant', async ({ database }) => {
      const cleanup = await database.isolate('before-add');

      // Make changes...

      await cleanup();
    });
  });
});
```

### 3. Error Handling

Always ensure snapshots are restored, even on test failures:

```typescript
test('should handle errors gracefully', async ({ database }) => {
  const cleanup = await database.isolate('error-test');

  try {
    // Test operations that might fail
    await database.prisma.participant.create({
      data: { identifier: 'INVALID' }, // This might fail
    });
  } finally {
    // Always restore, even on error
    await cleanup();
  }
});
```

### 4. Performance Considerations

- Use snapshots judiciously - they have overhead
- Create snapshots at appropriate granularity
- Prefer parallel tests for read-only operations

```typescript
// Good: Parallel tests for read operations
test.describe.parallel('Display Tests', () => {
  test('should show participant list', async ({ page }) => {
    // No database fixture needed
  });
});

// Good: Serial tests with snapshots for mutations
test.describe.serial('Mutation Tests', () => {
  test('should delete participant', async ({ database }) => {
    const cleanup = await database.isolate();
    // ... mutations ...
    await cleanup();
  });
});
```

## Advanced Usage

### Multiple Snapshots

```typescript
test('should handle complex workflow', async ({ database }) => {
  // Initial state
  await database.create('start');

  // Add some data
  await database.prisma.participant.create({
    data: { identifier: 'STEP1', label: 'Step 1 User' },
  });
  await database.create('after-step1');

  // Add more data
  await database.prisma.participant.create({
    data: { identifier: 'STEP2', label: 'Step 2 User' },
  });
  await database.create('after-step2');

  // Test rollback to step 1
  await database.restore('after-step1');
  const step1User = await database.prisma.participant.findFirst({
    where: { identifier: 'STEP1' },
  });
  const step2User = await database.prisma.participant.findFirst({
    where: { identifier: 'STEP2' },
  });

  expect(step1User).toBeTruthy();
  expect(step2User).toBeNull(); // Rolled back

  // Restore to initial state
  await database.restore('start');
});
```

### Conditional Snapshots

```typescript
test('should conditionally create snapshots', async ({ database }) => {
  const shouldMutate = process.env.TEST_MUTATION === 'true';

  let cleanup: (() => Promise<void>) | undefined;

  if (shouldMutate) {
    cleanup = await database.isolate('conditional-test');
  }

  // Test logic...

  if (cleanup) {
    await cleanup();
  }
});
```

## Troubleshooting

### Common Issues

**Snapshot not found**: Ensure the snapshot was created before attempting to restore

```typescript
// Bad
await database.restore('nonexistent');

// Good
await database.create('my-snapshot');
// ... operations ...
await database.restore('my-snapshot');
```

**Connection errors**: The global setup must run to establish database contexts

```typescript
// Error handling
test('should handle missing context gracefully', async ({ database }) => {
  try {
    await database.create('test');
  } catch (error) {
    test.skip(error.message.includes('No test environment context'));
  }
});
```

**Performance issues**: Avoid excessive snapshots in tight loops

```typescript
// Bad
for (let i = 0; i < 100; i++) {
  await database.create(`loop-${i}`);
}

// Good
await database.create('before-loop');
// ... do loop operations ...
await database.restore('before-loop');
```

### Debugging

Enable debug logging for database operations:

```typescript
test('should debug database operations', async ({ database }) => {
  // Check available data
  console.log('Participants:', await database.prisma.participant.count());

  await database.create('debug-snapshot');
  console.log('Snapshot created');

  // Make changes and verify
  await database.prisma.participant.deleteMany();
  console.log('After deletion:', await database.prisma.participant.count());

  await database.restore('debug-snapshot');
  console.log('After restore:', await database.prisma.participant.count());
});
```

### Context Detection Debugging

Debug context detection issues:

```typescript
test('should debug context detection', async ({ database }) => {
  // Get detailed context information
  const contextInfo = database.getContextInfo();

  console.log('Context Detection Debug:', {
    resolvedContext: contextInfo.resolvedContext,
    availableContexts: contextInfo.availableContexts,
    detectionMethod: contextInfo.detectionMethod,
    testFile: contextInfo.testFile,
    projectName: contextInfo.projectName,
    baseURL: contextInfo.baseURL,
  });

  // Verify expected context
  expect(contextInfo.resolvedContext).toBe('dashboard'); // or your expected context
});
```

## Integration with Visual Testing

Combine database snapshots with visual regression testing:

```typescript
test('should handle visual and database state', async ({
  page,
  snapshots,
  database,
}) => {
  // Set up specific database state
  const cleanup = await database.isolate('visual-test');

  await database.prisma.participant.deleteMany();
  await database.prisma.participant.create({
    data: { identifier: 'VIS001', label: 'Visual Test User' },
  });

  // Navigate and take visual snapshot
  await page.goto('/dashboard/participants');
  await snapshots.expectPageToMatchSnapshot(
    SNAPSHOT_CONFIGS.table('single-participant'),
  );

  // Cleanup database
  await cleanup();
});
```

This system provides comprehensive database state management while maintaining the simplicity and flexibility needed for effective e2e testing.
