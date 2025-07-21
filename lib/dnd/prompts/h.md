1.  Protocol Import Testing Scope

The plan mentions "Test .netcanvas file upload and parsing" but I need clarification on:

- Should we test with real .netcanvas files or mock files?

A real .netcanvas file should be used. I have added one to tests/data/Sample Protocol v5.netcanvas.

- What specific validation errors should we test (corrupted files, invalid schemas, etc.)?

For this, we should create a mock protocol, that is invalid in a basic way. Validation is tested elsewhere (within that library). Construct a mock invalid .netcanvas file.

- Should we test the actual UploadThing service integration or mock it?

Ideally, I would like to mock this service. I am unsure how to do this. It may require more in-depth discussion.

2. Bulk Operations Test Data

For testing bulk operations (protocols, participants, interviews):

- What's the recommended number of items for bulk testing (10, 50, 100+)?

I have no opinion on this.

- Should we test performance implications of bulk operations?

No.

- Are there specific edge cases for bulk operations (e.g., partial failures)?

The participant import functionality supports partial failures (where some participant IDs in a CSV are already present, but others are not). We should test this.

3. CSV Import/Export Testing

The plan mentions CSV import/export for participants:

- Should we test with various CSV formats (different encodings, delimiters)?

No, we should only test with the format that is currently supported by the application, as well as covering error handling for badly formatted files.

- What specific validation errors should we cover (duplicate identifiers, invalid data types)?

Duplicate identifiers, missing columns. If you can construct tests for invalid data types, that would be great, although I am not sure what data would be condidered invalid.

- Should we test large CSV files for performance?

Yes, we should test with large CSV files to ensure performance is acceptable. A good size would be 1000 rows.

4. Real-time Updates Testing

For "Interview Monitoring: Test real-time interview status updates":

This is a misunderstanding - there are no real-time features in the interview at present. Remove references to this from the plan.

5. Service Integration Strategy

Multiple tasks involve external services (UploadThing, file processing):

- Should we test against real services or use comprehensive mocking?

In general, we need to mock these services. I would like to be presented with options for this when you are implementing so that I can decide how to continue.

- What's the preferred approach for handling external service failures?

The application should handle these gracefully, ideally with user-friendly error messages. We should test scenarios where these services are unavailable or return errors.

- Should we test rate limiting and quota scenarios?

No.

6. Mobile/Responsive Testing

While not explicitly mentioned in Phase A, the dashboard has responsive design:

- Should Phase A include basic responsive testing?

Not at this time.

- Are there specific mobile breakpoints to test?

No.

- Should we test touch interactions for mobile devices?

No.
