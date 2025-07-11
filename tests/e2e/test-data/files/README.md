# Test Data Files

This directory contains static test files used in functional tests.

## Directory Structure

- `protocols/` - Protocol files (.netcanvas format)
- `assets/` - Image and asset files for protocol testing
- `exports/` - Sample export files for testing import functionality
- `csv/` - CSV files for participant/interview data import testing

## Usage

These files are used in functional tests to provide consistent test data:

```typescript
// Example usage in tests
const protocolPath = path.join(__dirname, 'files/protocols/sample-protocol.netcanvas');
await uploadProtocolFile(protocolPath);
```

## File Types

- `.netcanvas` - Protocol definition files
- `.csv` - Participant and interview data files
- `.json` - Configuration and data files
- `.png/.jpg` - Image assets for protocol testing
- `.zip` - Archive files for bulk operations

## Naming Convention

Files should be named descriptively:
- `sample-protocol-v1.netcanvas` - Basic protocol for testing
- `participants-100-rows.csv` - CSV with 100 participant records
- `interview-data-complete.json` - Complete interview data set
- `test-asset-image.png` - Image asset for testing

## Maintenance

- Keep files small and focused on specific test scenarios
- Update files when protocol format changes
- Remove unused files periodically
- Document any special requirements for files