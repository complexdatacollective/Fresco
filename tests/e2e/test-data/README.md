# Test Data Files for Phase A Functional Testing

This directory contains comprehensive test data files for Fresco's Phase A functional testing, including protocol files, participant data, and various edge cases for validation testing.

## Directory Structure

```
test-data/
├── files/
│   ├── invalid-protocol.netcanvas       # Corrupted protocol file for error testing
│   ├── protocols/                       # Valid protocol files
│   ├── assets/                          # Image and asset files
│   ├── exports/                         # Sample export files
│   ├── csv/                             # CSV files for import testing
│   └── README.md                        # File usage documentation
├── participants/                        # Participant test data
│   ├── csv/                             # CSV import files
│   │   ├── valid-participants.csv       # 20 realistic participants
│   │   ├── duplicate-participants.csv   # Mix of new and existing IDs
│   │   ├── invalid-participants.csv     # Various validation errors
│   │   ├── large-participants.csv       # 1000 participants for performance
│   │   ├── empty-participants.csv       # Empty file for error testing
│   │   └── sample-participants-small.csv # Original small dataset
│   ├── json/                            # Structured participant data
│   │   └── participant-data.json        # JSON format for programmatic use
│   ├── bulk/                            # Bulk operation files
│   └── README.md                        # Participant data documentation
└── README.md                            # This file
```

## File Descriptions

### Protocol Files

#### `files/invalid-protocol.netcanvas`
- **Purpose**: Test protocol upload error handling
- **Contents**: Malformed JSON with comments and missing closing braces
- **Expected Behavior**: Should fail validation and display appropriate error messages
- **Usage**: Upload tests, error boundary testing

### Participant CSV Files

#### `participants/valid-participants.csv`
- **Purpose**: Standard participant import testing
- **Contents**: 20 realistic participants with valid identifiers and labels
- **Format**: `identifier,label` header with properly formatted data
- **Usage**: Successful import scenarios, data validation tests

#### `participants/duplicate-participants.csv`
- **Purpose**: Test duplicate identifier handling
- **Contents**: Mix of existing and new participant IDs with some duplicates
- **Expected Behavior**: Should handle collisions gracefully, import new participants only
- **Usage**: Duplicate detection tests, conflict resolution scenarios

#### `participants/invalid-participants.csv`
- **Purpose**: Test various validation error scenarios
- **Contents**: 
  - Wrong column headers (`wrong_header,another_wrong_header`)
  - Empty identifiers and labels
  - Whitespace-only values
  - Identifiers exceeding 255 character limit
- **Expected Behavior**: Should fail validation with specific error messages
- **Usage**: Form validation tests, error message verification

#### `participants/large-participants.csv`
- **Purpose**: Performance testing with large datasets
- **Contents**: 1000 participants with unique identifiers (P0001-P1000)
- **Usage**: 
  - Performance benchmarking
  - UI responsiveness testing
  - Memory usage validation
  - Database query optimization testing

#### `participants/empty-participants.csv`
- **Purpose**: Test empty file handling
- **Contents**: Completely empty file
- **Expected Behavior**: Should display appropriate error message
- **Usage**: Edge case testing, file validation

## Data Schema

### Participant Data Structure

Based on the application's validation schema:

```csv
identifier,label
P001,Alice Johnson
```

**Field Requirements:**
- `identifier`: String, 1-255 characters, unique, no whitespace-only values
- `label`: String, optional, can be empty or undefined
- **Validation Rule**: Either `identifier` OR `label` must be provided (not both empty)

### Protocol Data Structure

Protocols use the `.netcanvas` format and must conform to the `@codaco/protocol-validation` schema:

```json
{
  "stages": [...],
  "codebook": {...},
  "schemaVersion": 3,
  "lastModified": "2023-01-01T00:00:00.000Z",
  "description": "Protocol description"
}
```

## Usage Examples

### Test Implementation

```typescript
// Import participants for testing
import { test } from '~/tests/e2e/fixtures/functional';

test('should import valid participants', async ({ page }) => {
  const csvPath = 'tests/e2e/test-data/participants/valid-participants.csv';
  await page.uploadFile('[data-testid="csv-upload"]', csvPath);
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test('should handle duplicate participants', async ({ page }) => {
  const csvPath = 'tests/e2e/test-data/participants/duplicate-participants.csv';
  await page.uploadFile('[data-testid="csv-upload"]', csvPath);
  await expect(page.locator('[data-testid="collision-warning"]')).toBeVisible();
});

test('should reject invalid participants', async ({ page }) => {
  const csvPath = 'tests/e2e/test-data/participants/invalid-participants.csv';
  await page.uploadFile('[data-testid="csv-upload"]', csvPath);
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

### Performance Testing

```typescript
test('should handle large participant datasets', async ({ page }) => {
  const csvPath = 'tests/e2e/test-data/participants/large-participants.csv';
  
  // Measure upload time
  const startTime = Date.now();
  await page.uploadFile('[data-testid="csv-upload"]', csvPath);
  await page.waitForSelector('[data-testid="import-complete"]');
  const uploadTime = Date.now() - startTime;
  
  // Assert performance threshold
  expect(uploadTime).toBeLessThan(30000); // Should complete within 30 seconds
});
```

### Error Handling Testing

```typescript
test('should handle corrupted protocol files', async ({ page }) => {
  const protocolPath = 'tests/e2e/test-data/files/invalid-protocol.netcanvas';
  await page.uploadFile('[data-testid="protocol-upload"]', protocolPath);
  
  // Should display specific error message
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Invalid protocol file format');
});
```

## Test Scenarios

### Participant Import Testing

1. **Valid Import**: Use `valid-participants.csv` for successful import scenarios
2. **Duplicate Handling**: Use `duplicate-participants.csv` to test collision detection
3. **Validation Errors**: Use `invalid-participants.csv` for form validation testing
4. **Performance**: Use `large-participants.csv` for load testing
5. **Edge Cases**: Use `empty-participants.csv` for empty file handling

### Protocol Upload Testing

1. **Error Handling**: Use `invalid-protocol.netcanvas` for upload error scenarios
2. **File Validation**: Test various file formats and sizes
3. **Processing**: Test protocol parsing and validation

## Best Practices

1. **Test Data Isolation**: Each test should use fresh data to avoid conflicts
2. **Cleanup**: Remove test data after test completion
3. **Realistic Data**: Use realistic but fake data (no real PII)
4. **Edge Cases**: Include boundary conditions and error scenarios
5. **Performance**: Test with varying data sizes to identify bottlenecks

## Maintenance

### Adding New Test Data

1. Create files following the naming convention: `{purpose}-{type}.{extension}`
2. Update this README with descriptions and usage examples
3. Add validation for new data formats
4. Include both positive and negative test cases

### Data Updates

- Review and update test data quarterly
- Ensure compliance with current schema validation rules
- Add new edge cases as bugs are discovered
- Keep performance test data current with expected usage patterns

## Notes

- All participant data is fake and generated for testing purposes
- Protocol files follow the Network Canvas specification
- File sizes are optimized for CI/CD pipeline performance
- All test data is committed to version control for consistency

## Related Documentation

- [Phase A Setup Guide](../PHASE-A-SETUP.md)
- [Participant Schema](../../../schemas/participant.ts)
- [Protocol Schema](../../../schemas/protocol.ts)
- [Functional Testing Guide](../functional/dashboard/README.md)