# Test Data - Participants

This directory contains participant-related test data for functional tests.

## Directory Structure

- `csv/` - CSV files for participant import testing
- `json/` - JSON data files for participant creation
- `bulk/` - Files for bulk operations testing

## CSV Files

CSV files should follow the expected format for participant import:

```csv
identifier,name,email,notes
P001,Test Participant 1,test1@example.com,Test notes
P002,Test Participant 2,test2@example.com,Another test
```

## JSON Files

JSON files for programmatic participant creation:

```json
{
  "participants": [
    {
      "identifier": "P001",
      "name": "Test Participant 1",
      "email": "test1@example.com",
      "notes": "Test notes"
    }
  ]
}
```

## Usage in Tests

```typescript
// Import CSV file
const csvPath = path.join(__dirname, 'participants/csv/sample-participants.csv');
await importParticipantsFromCSV(csvPath);

// Load JSON data
const jsonPath = path.join(__dirname, 'participants/json/participant-data.json');
const participantData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
```

## File Naming

- `sample-participants-small.csv` - Small set (5-10 participants)
- `sample-participants-medium.csv` - Medium set (50-100 participants)
- `sample-participants-large.csv` - Large set (500+ participants)
- `invalid-participants.csv` - Invalid data for error testing
- `duplicate-participants.csv` - Duplicate data for validation testing

## Data Guidelines

- Use realistic but fake data (no real personal information)
- Include edge cases (empty fields, special characters)
- Provide both valid and invalid data sets
- Keep consistent formatting across files
- Include comments in JSON files for clarity