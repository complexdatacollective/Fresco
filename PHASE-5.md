# PHASE 5: Dashboard Route Testing

This phase implements comprehensive functional testing for all dashboard routes, covering CRUD operations, data interactions, and complex user workflows.

## Prerequisites

- Phase 1-4 completed successfully
- Understanding of Fresco's dashboard functionality
- Familiarity with the data models (Protocols, Participants, Interviews)

## Task 5.1: Dashboard Overview Testing

**Objective**: Test the main dashboard page functionality, including summary statistics and activity feed.

**Steps**:

1. **Create dashboard test directory structure**:

   ```bash
   mkdir -p tests/e2e/dashboard
   touch tests/e2e/dashboard/overview.spec.ts
   ```

2. **Add dashboard overview tests**:

   ```typescript
   // tests/e2e/dashboard/overview.spec.ts
   import { test, expect } from '../fixtures';

   test.describe('Dashboard Overview', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Dashboard data fixture provides comprehensive test data
     });

     test('should display dashboard with summary statistics', async ({
       authenticatedPage,
       dashboardPage,
       assertions,
     }) => {
       await dashboardPage.goto();
       await dashboardPage.verifyOnDashboard();

       // Verify summary statistics are visible
       await assertions.assertPageLoaded(authenticatedPage, /.*\/dashboard/);
       await expect(
         authenticatedPage.locator('[data-testid="summary-statistics"]'),
       ).toBeVisible();

       // Verify stat cards are present
       const statCards = [
         'total-protocols',
         'total-participants',
         'total-interviews',
         'completed-interviews',
       ];

       for (const card of statCards) {
         await expect(
           authenticatedPage.locator(`[data-testid="${card}"]`),
         ).toBeVisible();
         await expect(
           authenticatedPage.locator(
             `[data-testid="${card}"] [data-testid="stat-value"]`,
           ),
         ).not.toBeEmpty();
       }
     });

     test('should display correct summary statistics based on data', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
       db,
     }) => {
       await dashboardPage.goto();

       // Get actual counts from database
       const protocolCount = await db.protocol.count();
       const participantCount = await db.participant.count();
       const interviewCount = await db.interview.count();
       const completedInterviewCount = await db.interview.count({
         where: { finishTime: { not: null } },
       });

       // Verify displayed counts match database
       await expect(
         authenticatedPage.locator(
           '[data-testid="total-protocols"] [data-testid="stat-value"]',
         ),
       ).toHaveText(protocolCount.toString());
       await expect(
         authenticatedPage.locator(
           '[data-testid="total-participants"] [data-testid="stat-value"]',
         ),
       ).toHaveText(participantCount.toString());
       await expect(
         authenticatedPage.locator(
           '[data-testid="total-interviews"] [data-testid="stat-value"]',
         ),
       ).toHaveText(interviewCount.toString());
       await expect(
         authenticatedPage.locator(
           '[data-testid="completed-interviews"] [data-testid="stat-value"]',
         ),
       ).toHaveText(completedInterviewCount.toString());
     });

     test('should display activity feed with recent activities', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();

       // Verify activity feed is visible
       await expect(
         authenticatedPage.locator('[data-testid="activity-feed"]'),
       ).toBeVisible();

       // Verify activity items are present
       const activityItems = authenticatedPage.locator(
         '[data-testid="activity-item"]',
       );
       await expect(activityItems).toHaveCount({ min: 1 });

       // Verify activity items have required content
       const firstActivity = activityItems.first();
       await expect(
         firstActivity.locator('[data-testid="activity-type"]'),
       ).toBeVisible();
       await expect(
         firstActivity.locator('[data-testid="activity-description"]'),
       ).toBeVisible();
       await expect(
         firstActivity.locator('[data-testid="activity-timestamp"]'),
       ).toBeVisible();
     });

     test('should handle empty dashboard state gracefully', async ({
       cleanDatabase,
       authenticatedPage,
       dashboardPage,
     }) => {
       await cleanDatabase();
       await dashboardPage.goto();

       // Verify zero counts are displayed
       await expect(
         authenticatedPage.locator(
           '[data-testid="total-protocols"] [data-testid="stat-value"]',
         ),
       ).toHaveText('0');
       await expect(
         authenticatedPage.locator(
           '[data-testid="total-participants"] [data-testid="stat-value"]',
         ),
       ).toHaveText('0');

       // Verify empty state message for activity feed
       await expect(
         authenticatedPage.locator('[data-testid="activity-feed-empty"]'),
       ).toBeVisible();
     });

     test('should navigate to different sections from dashboard', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();

       // Test navigation from summary statistics
       await authenticatedPage.click('[data-testid="total-protocols"]');
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/protocols/);

       await dashboardPage.goto();
       await authenticatedPage.click('[data-testid="total-participants"]');
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/participants/);

       await dashboardPage.goto();
       await authenticatedPage.click('[data-testid="total-interviews"]');
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/interviews/);
     });

     test('should refresh dashboard data correctly', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.goto();

       // Get initial count
       const initialCount = await authenticatedPage
         .locator('[data-testid="total-protocols"] [data-testid="stat-value"]')
         .textContent();

       // Create new protocol via database
       await db.protocol.create({
         data: {
           name: 'New Test Protocol',
           hash: 'test-hash-123',
           description: 'Test protocol created during test',
           schemaVersion: 6,
           lastModified: new Date(),
           stages: [],
           codebook: { node: {}, edge: {}, ego: { variables: {} } },
         },
       });

       // Refresh page
       await authenticatedPage.reload();

       // Verify count increased
       const newCount = await authenticatedPage
         .locator('[data-testid="total-protocols"] [data-testid="stat-value"]')
         .textContent();
       expect(parseInt(newCount!)).toBe(parseInt(initialCount!) + 1);
     });
   });
   ```

3. **Create navigation tests**:

   ```bash
   touch tests/e2e/dashboard/navigation.spec.ts
   ```

4. **Add navigation tests**:

   ```typescript
   // tests/e2e/dashboard/navigation.spec.ts
   import { test, expect } from '../fixtures';

   test.describe('Dashboard Navigation', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Use dashboard data for comprehensive navigation testing
     });

     test('should navigate between dashboard sections', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();

       // Test navigation to each section
       await dashboardPage.navigateToProtocols();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/protocols/);
       await expect(
         authenticatedPage.locator('[data-testid="page-title"]'),
       ).toContainText('Protocols');

       await dashboardPage.navigateToParticipants();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/participants/);
       await expect(
         authenticatedPage.locator('[data-testid="page-title"]'),
       ).toContainText('Participants');

       await dashboardPage.navigateToInterviews();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/interviews/);
       await expect(
         authenticatedPage.locator('[data-testid="page-title"]'),
       ).toContainText('Interviews');

       await dashboardPage.navigateToSettings();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/settings/);
       await expect(
         authenticatedPage.locator('[data-testid="page-title"]'),
       ).toContainText('Settings');
     });

     test('should highlight active navigation item', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();

       // Check that overview is active initially
       await expect(
         authenticatedPage.locator('[data-testid="nav-overview"]'),
       ).toHaveClass(/active/);

       // Navigate and check active states
       await dashboardPage.navigateToProtocols();
       await expect(
         authenticatedPage.locator('[data-testid="nav-protocols"]'),
       ).toHaveClass(/active/);
       await expect(
         authenticatedPage.locator('[data-testid="nav-overview"]'),
       ).not.toHaveClass(/active/);

       await dashboardPage.navigateToParticipants();
       await expect(
         authenticatedPage.locator('[data-testid="nav-participants"]'),
       ).toHaveClass(/active/);
       await expect(
         authenticatedPage.locator('[data-testid="nav-protocols"]'),
       ).not.toHaveClass(/active/);
     });

     test('should preserve navigation state on page refresh', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Refresh the page
       await authenticatedPage.reload();

       // Verify we're still on protocols page
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/protocols/);
       await expect(
         authenticatedPage.locator('[data-testid="nav-protocols"]'),
       ).toHaveClass(/active/);
     });

     test('should handle direct URL navigation', async ({
       authenticatedPage,
     }) => {
       // Navigate directly to each section
       const sections = ['protocols', 'participants', 'interviews', 'settings'];

       for (const section of sections) {
         await authenticatedPage.goto(`/dashboard/${section}`);
         await expect(authenticatedPage).toHaveURL(
           new RegExp(`.*\/dashboard\/${section}`),
         );
         await expect(
           authenticatedPage.locator(`[data-testid="nav-${section}"]`),
         ).toHaveClass(/active/);
       }
     });

     test('should handle user menu interactions', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();

       // Open user menu
       await dashboardPage.openUserMenu();
       await expect(
         authenticatedPage.locator('[data-testid="user-menu-dropdown"]'),
       ).toBeVisible();

       // Check menu items
       await expect(
         authenticatedPage.locator('[data-testid="user-profile-link"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="logout-button"]'),
       ).toBeVisible();

       // Close menu by clicking outside
       await authenticatedPage.click('body');
       await expect(
         authenticatedPage.locator('[data-testid="user-menu-dropdown"]'),
       ).not.toBeVisible();
     });

     test('should logout successfully from navigation', async ({
       authenticatedPage,
       dashboardPage,
       signinPage,
     }) => {
       await dashboardPage.goto();

       // Logout via user menu
       await dashboardPage.logout();

       // Verify redirected to signin
       await signinPage.verifyOnSigninPage();
     });
   });
   ```

**Verification**: Run dashboard overview tests to ensure they pass.

## Task 5.2: Protocols Management Testing

**Objective**: Test all protocols-related functionality including CRUD operations, file uploads, and protocol management.

**Steps**:

1. **Create protocols tests**:

   ```bash
   touch tests/e2e/dashboard/protocols.spec.ts
   ```

2. **Add comprehensive protocols tests**:

   ```typescript
   // tests/e2e/dashboard/protocols.spec.ts
   import { test, expect } from '../fixtures';
   import { DataTableComponent } from '../page-objects/components';

   test.describe('Protocols Management', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Dashboard data provides multiple protocols for testing
     });

     test('should display protocols table with data', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(
         authenticatedPage,
         '[data-testid="data-table"]',
       );
       await protocolsTable.waitForVisible();
       await protocolsTable.verifyTableNotEmpty();

       // Verify table headers
       const headers = await protocolsTable.getColumnHeaders();
       expect(headers).toContain('Name');
       expect(headers).toContain('Description');
       expect(headers).toContain('Last Modified');
       expect(headers).toContain('Actions');
     });

     test('should search protocols by name', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);
       const searchTerm = dashboardData.protocols[0].name.split(' ')[0];

       // Search for protocol
       await protocolsTable.search(searchTerm);

       // Verify search results
       const rowCount = await protocolsTable.getRowCount();
       expect(rowCount).toBeGreaterThan(0);

       // Verify all visible rows contain search term
       for (let i = 0; i < rowCount; i++) {
         const nameCell = await protocolsTable.getCellText(i, 0);
         expect(nameCell.toLowerCase()).toContain(searchTerm.toLowerCase());
       }
     });

     test('should filter protocols', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Open filter panel
       await authenticatedPage.click('[data-testid="filter-button"]');
       await expect(
         authenticatedPage.locator('[data-testid="filter-panel"]'),
       ).toBeVisible();

       // Apply date filter
       await authenticatedPage.selectOption(
         '[data-testid="date-filter"]',
         'last-week',
       );
       await authenticatedPage.click('[data-testid="apply-filter"]');

       // Verify filter is applied
       await expect(
         authenticatedPage.locator('[data-testid="active-filters"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="filter-chip"]'),
       ).toContainText('Last Week');
     });

     test('should sort protocols by different columns', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);

       // Sort by name (ascending)
       await authenticatedPage.click(
         '[data-testid="data-table"] th:nth-child(1)',
       );

       // Verify sort indicator
       await expect(
         authenticatedPage.locator('[data-testid="sort-asc"]'),
       ).toBeVisible();

       // Get first two protocol names
       const firstProtocol = await protocolsTable.getCellText(0, 0);
       const secondProtocol = await protocolsTable.getCellText(1, 0);

       // Verify alphabetical order
       expect(firstProtocol.localeCompare(secondProtocol)).toBeLessThanOrEqual(
         0,
       );

       // Sort by name (descending)
       await authenticatedPage.click(
         '[data-testid="data-table"] th:nth-child(1)',
       );
       await expect(
         authenticatedPage.locator('[data-testid="sort-desc"]'),
       ).toBeVisible();
     });

     test('should view protocol details', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Click on first protocol name
       await authenticatedPage.click(
         '[data-testid="data-table"] tbody tr:first-child td:first-child a',
       );

       // Verify protocol details page
       await expect(authenticatedPage).toHaveURL(/.*\/protocols\/[a-zA-Z0-9]+/);
       await expect(
         authenticatedPage.locator('[data-testid="protocol-details"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="protocol-name"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="protocol-description"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="protocol-stages"]'),
       ).toBeVisible();
     });

     test('should delete protocol with confirmation', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await protocolsTable.getRowCount();

       // Open actions dropdown for first protocol
       await protocolsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="delete-action"]');

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Delete Protocol');

       // Confirm deletion
       await authenticatedPage.click('[data-testid="confirm-delete"]');

       // Verify protocol is deleted
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).not.toBeVisible();

       // Wait for table to update
       await authenticatedPage.waitForTimeout(1000);
       const newRowCount = await protocolsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount - 1);
     });

     test('should cancel protocol deletion', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await protocolsTable.getRowCount();

       // Open actions dropdown and click delete
       await protocolsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="delete-action"]');

       // Cancel deletion
       await authenticatedPage.click('[data-testid="cancel-delete"]');

       // Verify modal is closed and protocol still exists
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).not.toBeVisible();
       const newRowCount = await protocolsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount);
     });

     test('should handle protocol upload', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Click upload protocol button
       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Verify upload modal
       await expect(
         authenticatedPage.locator('[data-testid="upload-modal"]'),
       ).toBeVisible();

       // Create test protocol file
       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'Uploaded Test Protocol',
         description: 'Protocol uploaded via E2E test',
       });

       // Upload file
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );

       // Verify file is selected
       await expect(
         authenticatedPage.locator('[data-testid="selected-file"]'),
       ).toContainText('test-protocol');

       // Submit upload
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify upload success
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible();
       await authenticatedPage.click('[data-testid="close-modal"]');

       // Verify new protocol appears in table
       await expect(
         authenticatedPage.locator('[data-testid="data-table"]'),
       ).toContainText('Uploaded Test Protocol');
     });

     test('should handle invalid protocol file upload', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Create invalid file (not a protocol)
       const invalidFile = fileHelper.createTestImageFile();

       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         invalidFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify error message
       await expect(
         authenticatedPage.locator('[data-testid="upload-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-error"]'),
       ).toContainText('Invalid protocol file');
     });

     test('should export protocol', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);

       // Open actions dropdown for first protocol
       await protocolsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="export-action"]');

       // Verify export modal
       await expect(
         authenticatedPage.locator('[data-testid="export-modal"]'),
       ).toBeVisible();

       // Select export format
       await authenticatedPage.selectOption(
         '[data-testid="export-format"]',
         'json',
       );
       await authenticatedPage.click('[data-testid="export-submit"]');

       // Verify download starts (implementation depends on browser behavior)
       // This might need adjustment based on how downloads are handled
       await expect(
         authenticatedPage.locator('[data-testid="export-success"]'),
       ).toBeVisible();
     });

     test('should handle pagination', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       // Create many protocols to test pagination
       const protocolPromises = Array.from({ length: 25 }, (_, i) =>
         db.protocol.create({
           data: {
             name: `Pagination Test Protocol ${i + 1}`,
             hash: `pagination-test-${i + 1}`,
             description: `Test protocol ${i + 1} for pagination`,
             schemaVersion: 6,
             lastModified: new Date(),
             stages: [],
             codebook: { node: {}, edge: {}, ego: { variables: {} } },
           },
         }),
       );

       await Promise.all(protocolPromises);

       await dashboardPage.navigateToProtocols();

       const protocolsTable = new DataTableComponent(authenticatedPage);

       // Verify pagination controls
       await expect(
         authenticatedPage.locator('[data-testid="pagination"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="pagination-next"]'),
       ).toBeEnabled();

       // Go to next page
       await protocolsTable.goToNextPage();

       // Verify we're on page 2
       await expect(
         authenticatedPage.locator('[data-testid="current-page"]'),
       ).toContainText('2');

       // Verify previous button is now enabled
       await expect(
         authenticatedPage.locator('[data-testid="pagination-prev"]'),
       ).toBeEnabled();
     });
   });
   ```

**Verification**: Run protocols tests to ensure CRUD operations work correctly.

## Task 5.3: Participants Management Testing

**Objective**: Test participant management functionality including creation, import, URL generation, and participant data handling.

**Steps**:

1. **Create participants tests**:

   ```bash
   touch tests/e2e/dashboard/participants.spec.ts
   ```

2. **Add comprehensive participants tests**:

   ```typescript
   // tests/e2e/dashboard/participants.spec.ts
   import { test, expect } from '../fixtures';
   import {
     DataTableComponent,
     ModalComponent,
     FormComponent,
   } from '../page-objects/components';

   test.describe('Participants Management', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Dashboard data provides participants for testing
     });

     test('should display participants table with data', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(
         authenticatedPage,
         '[data-testid="participants-table"]',
       );
       await participantsTable.waitForVisible();
       await participantsTable.verifyTableNotEmpty();

       // Verify table headers
       const headers = await participantsTable.getColumnHeaders();
       expect(headers).toContain('Identifier');
       expect(headers).toContain('Label');
       expect(headers).toContain('Interviews');
       expect(headers).toContain('Actions');
     });

     test('should create new participant manually', async ({
       authenticatedPage,
       dashboardPage,
       dataGenerator,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await participantsTable.getRowCount();

       // Click add participant button
       await authenticatedPage.click('[data-testid="add-participant-button"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Add Participant');

       // Fill participant form
       const participantId = dataGenerator.randomParticipantId();
       const participantLabel = `Test Participant ${Date.now()}`;

       await modal.fillField('identifier', participantId);
       await modal.fillField('label', participantLabel);

       // Submit form
       await modal.confirm();
       await modal.verifyModalClosed();

       // Verify participant was added
       await authenticatedPage.waitForTimeout(1000);
       const newRowCount = await participantsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount + 1);

       // Verify participant appears in table
       await expect(
         authenticatedPage.locator('[data-testid="participants-table"]'),
       ).toContainText(participantId);
     });

     test('should validate participant form fields', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       await authenticatedPage.click('[data-testid="add-participant-button"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();

       // Try to submit empty form
       await modal.confirm();

       // Verify validation errors
       await expect(
         authenticatedPage.locator('[data-testid="error-identifier"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="error-identifier"]'),
       ).toContainText('required');

       // Fill identifier but leave label empty
       await modal.fillField('identifier', 'TEST123');
       await modal.confirm();

       // Verify label is optional (form should submit)
       await modal.verifyModalClosed();
     });

     test('should prevent duplicate participant identifiers', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToParticipants();

       await authenticatedPage.click('[data-testid="add-participant-button"]');

       const modal = new ModalComponent(authenticatedPage);

       // Try to use existing identifier
       const existingIdentifier = dashboardData.participants[0].identifier;
       await modal.fillField('identifier', existingIdentifier);
       await modal.fillField('label', 'Duplicate Test');
       await modal.confirm();

       // Verify error message
       await expect(
         authenticatedPage.locator('[data-testid="form-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="form-error"]'),
       ).toContainText('already exists');
     });

     test('should import participants from CSV', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await participantsTable.getRowCount();

       // Click import CSV button
       await authenticatedPage.click('[data-testid="import-csv-button"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Import Participants');

       // Create test CSV file
       const csvData = [
         { identifier: 'CSV001', label: 'CSV Participant 1' },
         { identifier: 'CSV002', label: 'CSV Participant 2' },
         { identifier: 'CSV003', label: 'CSV Participant 3' },
       ];
       const csvFile = fileHelper.createTestCSVFile(csvData);

       // Upload CSV file
       await authenticatedPage.setInputFiles(
         '[data-testid="csv-file-input"]',
         csvFile,
       );

       // Verify file preview
       await expect(
         authenticatedPage.locator('[data-testid="csv-preview"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="preview-row"]'),
       ).toHaveCount(3);

       // Confirm import
       await modal.confirm();

       // Verify import success
       await expect(
         authenticatedPage.locator('[data-testid="import-success"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="import-count"]'),
       ).toContainText('3 participants imported');

       await modal.close();

       // Verify participants were added to table
       await authenticatedPage.waitForTimeout(1000);
       const newRowCount = await participantsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount + 3);
     });

     test('should handle CSV import errors', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToParticipants();

       await authenticatedPage.click('[data-testid="import-csv-button"]');

       const modal = new ModalComponent(authenticatedPage);

       // Create CSV with invalid data (missing required fields)
       const invalidCsvData = [
         { label: 'Missing Identifier 1' },
         { identifier: '', label: 'Empty Identifier' },
       ];
       const csvFile = fileHelper.createTestCSVFile(invalidCsvData);

       await authenticatedPage.setInputFiles(
         '[data-testid="csv-file-input"]',
         csvFile,
       );
       await modal.confirm();

       // Verify error handling
       await expect(
         authenticatedPage.locator('[data-testid="import-errors"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="error-row"]'),
       ).toHaveCount(2);
     });

     test('should edit participant details', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);

       // Open actions dropdown for first participant
       await participantsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="edit-action"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Edit Participant');

       // Verify current values are populated
       const identifierValue = await authenticatedPage
         .locator('[name="identifier"]')
         .inputValue();
       expect(identifierValue).toBe(dashboardData.participants[0].identifier);

       // Update label
       const newLabel = `Updated Label ${Date.now()}`;
       await modal.fillField('label', newLabel);
       await modal.confirm();

       // Verify update
       await modal.verifyModalClosed();
       await expect(
         authenticatedPage.locator('[data-testid="participants-table"]'),
       ).toContainText(newLabel);
     });

     test('should delete participant with confirmation', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await participantsTable.getRowCount();

       // Open actions dropdown and delete
       await participantsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="delete-action"]');

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Delete Participant');
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-message"]'),
       ).toContainText('This will also delete all associated interviews');

       // Confirm deletion
       await authenticatedPage.click('[data-testid="confirm-delete"]');

       // Verify participant deleted
       await authenticatedPage.waitForTimeout(1000);
       const newRowCount = await participantsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount - 1);
     });

     test('should generate participant interview URL', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);

       // Open actions dropdown and generate URL
       await participantsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="generate-url-action"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Generate Interview URL');

       // Select protocol
       const protocolSelect = authenticatedPage.locator(
         '[data-testid="protocol-select"]',
       );
       await protocolSelect.selectOption({ index: 1 }); // Select first available protocol

       await modal.confirm();

       // Verify URL is generated
       await expect(
         authenticatedPage.locator('[data-testid="generated-url"]'),
       ).toBeVisible();
       const generatedUrl = await authenticatedPage
         .locator('[data-testid="generated-url"] input')
         .inputValue();
       expect(generatedUrl).toContain('/interview/');

       // Test copy URL functionality
       await authenticatedPage.click('[data-testid="copy-url-button"]');
       await expect(
         authenticatedPage.locator('[data-testid="copy-success"]'),
       ).toBeVisible();
     });

     test('should search participants', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToParticipants();

       const participantsTable = new DataTableComponent(authenticatedPage);

       // Search by identifier
       const searchTerm = dashboardData.participants[0].identifier.substring(
         0,
         3,
       );
       await participantsTable.search(searchTerm);

       // Verify search results
       const rowCount = await participantsTable.getRowCount();
       expect(rowCount).toBeGreaterThan(0);

       // Verify all results contain search term
       for (let i = 0; i < rowCount; i++) {
         const identifierCell = await participantsTable.getCellText(i, 0);
         expect(identifierCell.toLowerCase()).toContain(
           searchTerm.toLowerCase(),
         );
       }

       // Clear search
       await participantsTable.clearSearch();

       // Verify all participants shown again
       const allRowCount = await participantsTable.getRowCount();
       expect(allRowCount).toBeGreaterThan(rowCount);
     });

     test('should export participants list', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       // Click export button
       await authenticatedPage.click(
         '[data-testid="export-participants-button"]',
       );

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Export Participants');

       // Select export format
       await authenticatedPage.selectOption(
         '[data-testid="export-format"]',
         'csv',
       );

       // Select export options
       await authenticatedPage.check('[data-testid="include-interview-count"]');
       await authenticatedPage.check('[data-testid="include-urls"]');

       await modal.confirm();

       // Verify export initiated
       await expect(
         authenticatedPage.locator('[data-testid="export-success"]'),
       ).toBeVisible();
     });

     test('should handle bulk participant operations', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       // Select multiple participants
       await authenticatedPage.check(
         '[data-testid="participants-table"] tbody tr:nth-child(1) [data-testid="row-checkbox"]',
       );
       await authenticatedPage.check(
         '[data-testid="participants-table"] tbody tr:nth-child(2) [data-testid="row-checkbox"]',
       );

       // Verify bulk actions toolbar appears
       await expect(
         authenticatedPage.locator('[data-testid="bulk-actions-toolbar"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="selected-count"]'),
       ).toContainText('2 selected');

       // Test bulk URL generation
       await authenticatedPage.click('[data-testid="bulk-generate-urls"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Generate URLs for 2 Participants');

       // Select protocol and confirm
       await authenticatedPage.selectOption('[data-testid="protocol-select"]', {
         index: 1,
       });
       await modal.confirm();

       // Verify bulk operation success
       await expect(
         authenticatedPage.locator('[data-testid="bulk-success"]'),
       ).toBeVisible();
     });
   });
   ```

**Verification**: Run participants tests to ensure all participant management features work correctly.

## Task 5.4: Interviews Management Testing

**Objective**: Test interview data viewing, filtering, exporting, and network analysis features.

**Steps**:

1. **Create interviews tests**:

   ```bash
   touch tests/e2e/dashboard/interviews.spec.ts
   ```

2. **Add comprehensive interviews tests**:

   ```typescript
   // tests/e2e/dashboard/interviews.spec.ts
   import { test, expect } from '../fixtures';
   import {
     DataTableComponent,
     ModalComponent,
   } from '../page-objects/components';

   test.describe('Interviews Management', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Dashboard data provides interviews with various states
     });

     test('should display interviews table with data', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       const interviewsTable = new DataTableComponent(
         authenticatedPage,
         '[data-testid="interviews-table"]',
       );
       await interviewsTable.waitForVisible();
       await interviewsTable.verifyTableNotEmpty();

       // Verify table headers
       const headers = await interviewsTable.getColumnHeaders();
       expect(headers).toContain('Participant');
       expect(headers).toContain('Protocol');
       expect(headers).toContain('Status');
       expect(headers).toContain('Progress');
       expect(headers).toContain('Started');
       expect(headers).toContain('Actions');
     });

     test('should display correct interview status indicators', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Verify different status badges are present
       const statusBadges = authenticatedPage.locator(
         '[data-testid="status-badge"]',
       );
       const statusCount = await statusBadges.count();
       expect(statusCount).toBeGreaterThan(0);

       // Check for various status types
       const statusTypes = ['in-progress', 'completed', 'not-started'];

       for (const status of statusTypes) {
         const statusElements = authenticatedPage.locator(
           `[data-testid="status-badge"][data-status="${status}"]`,
         );
         const count = await statusElements.count();
         if (count > 0) {
           await expect(statusElements.first()).toBeVisible();
         }
       }
     });

     test('should show interview progress correctly', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Verify progress bars are present
       const progressBars = authenticatedPage.locator(
         '[data-testid="progress-bar"]',
       );
       const progressCount = await progressBars.count();
       expect(progressCount).toBeGreaterThan(0);

       // Check progress percentage is valid
       const firstProgressBar = progressBars.first();
       const progressText = await firstProgressBar
         .locator('[data-testid="progress-text"]')
         .textContent();
       const progressMatch = progressText?.match(/(\d+)%/);

       if (progressMatch) {
         const percentage = parseInt(progressMatch[1]);
         expect(percentage).toBeGreaterThanOrEqual(0);
         expect(percentage).toBeLessThanOrEqual(100);
       }
     });

     test('should filter interviews by status', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       const interviewsTable = new DataTableComponent(authenticatedPage);

       // Open filter panel
       await authenticatedPage.click('[data-testid="filter-button"]');
       await expect(
         authenticatedPage.locator('[data-testid="filter-panel"]'),
       ).toBeVisible();

       // Filter by completed status
       await authenticatedPage.check('[data-testid="filter-completed"]');
       await authenticatedPage.click('[data-testid="apply-filter"]');

       // Verify filter is applied
       await expect(
         authenticatedPage.locator('[data-testid="active-filters"]'),
       ).toBeVisible();

       // Verify all visible interviews have completed status
       const statusBadges = authenticatedPage.locator(
         '[data-testid="status-badge"]',
       );
       const badgeCount = await statusBadges.count();

       for (let i = 0; i < badgeCount; i++) {
         const status = await statusBadges.nth(i).getAttribute('data-status');
         expect(status).toBe('completed');
       }
     });

     test('should filter interviews by date range', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Open filter panel
       await authenticatedPage.click('[data-testid="filter-button"]');

       // Set date range filter
       const today = new Date();
       const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

       await authenticatedPage.fill(
         '[data-testid="date-from"]',
         lastWeek.toISOString().split('T')[0],
       );
       await authenticatedPage.fill(
         '[data-testid="date-to"]',
         today.toISOString().split('T')[0],
       );
       await authenticatedPage.click('[data-testid="apply-filter"]');

       // Verify filter is applied
       await expect(
         authenticatedPage.locator('[data-testid="filter-chip"]'),
       ).toContainText('Date Range');
     });

     test('should view interview network summary', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Click on view network button for first interview
       await authenticatedPage.click(
         '[data-testid="interviews-table"] tbody tr:first-child [data-testid="view-network"]',
       );

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Network Summary');

       // Verify network summary content
       await expect(
         authenticatedPage.locator('[data-testid="network-stats"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="node-count"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="edge-count"]'),
       ).toBeVisible();

       // Check for network visualization
       await expect(
         authenticatedPage.locator('[data-testid="network-visualization"]'),
       ).toBeVisible();
     });

     test('should export interview data', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Click export button
       await authenticatedPage.click(
         '[data-testid="export-interviews-button"]',
       );

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Export Interview Data');

       // Select export options
       await authenticatedPage.check('[data-testid="include-completed-only"]');
       await authenticatedPage.selectOption(
         '[data-testid="export-format"]',
         'csv',
       );

       // Select what to include
       await authenticatedPage.check('[data-testid="include-network-data"]');
       await authenticatedPage.check(
         '[data-testid="include-participant-attributes"]',
       );

       await modal.confirm();

       // Verify export initiated
       await expect(
         authenticatedPage.locator('[data-testid="export-progress"]'),
       ).toBeVisible();

       // Wait for export completion
       await expect(
         authenticatedPage.locator('[data-testid="export-complete"]'),
       ).toBeVisible({ timeout: 30000 });
       await expect(
         authenticatedPage.locator('[data-testid="download-link"]'),
       ).toBeVisible();
     });

     test('should delete interview with confirmation', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       const interviewsTable = new DataTableComponent(authenticatedPage);
       const initialRowCount = await interviewsTable.getRowCount();

       // Open actions dropdown and delete
       await interviewsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="delete-action"]');

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Delete Interview');

       // Confirm deletion
       await authenticatedPage.click('[data-testid="confirm-delete"]');

       // Verify interview deleted
       await authenticatedPage.waitForTimeout(1000);
       const newRowCount = await interviewsTable.getRowCount();
       expect(newRowCount).toBe(initialRowCount - 1);
     });

     test('should search interviews by participant', async ({
       authenticatedPage,
       dashboardPage,
       dashboardData,
     }) => {
       await dashboardPage.navigateToInterviews();

       const interviewsTable = new DataTableComponent(authenticatedPage);

       // Search by participant identifier
       const searchTerm = dashboardData.participants[0].identifier;
       await interviewsTable.search(searchTerm);

       // Verify search results
       const rowCount = await interviewsTable.getRowCount();

       if (rowCount > 0) {
         // Verify search results contain the participant
         const participantCell = await interviewsTable.getCellText(0, 0); // Assuming participant is first column
         expect(participantCell).toContain(searchTerm);
       }
     });

     test('should sort interviews by different columns', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Sort by start date
       await authenticatedPage.click(
         '[data-testid="interviews-table"] th:contains("Started")',
       );

       // Verify sort indicator
       await expect(
         authenticatedPage.locator('[data-testid="sort-indicator"]'),
       ).toBeVisible();

       // Sort by status
       await authenticatedPage.click(
         '[data-testid="interviews-table"] th:contains("Status")',
       );

       // Verify sort changed
       await expect(
         authenticatedPage.locator('[data-testid="sort-indicator"]'),
       ).toBeVisible();
     });

     test('should handle bulk interview operations', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Select multiple interviews
       await authenticatedPage.check(
         '[data-testid="interviews-table"] tbody tr:nth-child(1) [data-testid="row-checkbox"]',
       );
       await authenticatedPage.check(
         '[data-testid="interviews-table"] tbody tr:nth-child(2) [data-testid="row-checkbox"]',
       );

       // Verify bulk actions toolbar
       await expect(
         authenticatedPage.locator('[data-testid="bulk-actions-toolbar"]'),
       ).toBeVisible();

       // Test bulk export
       await authenticatedPage.click('[data-testid="bulk-export"]');

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Export Selected Interviews');

       await authenticatedPage.selectOption(
         '[data-testid="export-format"]',
         'json',
       );
       await modal.confirm();

       // Verify bulk export initiated
       await expect(
         authenticatedPage.locator('[data-testid="bulk-export-progress"]'),
       ).toBeVisible();
     });

     test('should display interview timeline/activity', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       // Click on timeline button for first interview
       await authenticatedPage.click(
         '[data-testid="interviews-table"] tbody tr:first-child [data-testid="view-timeline"]',
       );

       const modal = new ModalComponent(authenticatedPage);
       await modal.verifyModalOpen();
       await modal.verifyTitle('Interview Timeline');

       // Verify timeline content
       await expect(
         authenticatedPage.locator('[data-testid="timeline-events"]'),
       ).toBeVisible();

       // Check for timeline entries
       const timelineEntries = authenticatedPage.locator(
         '[data-testid="timeline-entry"]',
       );
       const entryCount = await timelineEntries.count();
       expect(entryCount).toBeGreaterThan(0);

       // Verify timeline entry structure
       const firstEntry = timelineEntries.first();
       await expect(
         firstEntry.locator('[data-testid="entry-timestamp"]'),
       ).toBeVisible();
       await expect(
         firstEntry.locator('[data-testid="entry-description"]'),
       ).toBeVisible();
     });

     test('should handle interview restart functionality', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToInterviews();

       const interviewsTable = new DataTableComponent(authenticatedPage);

       // Find an in-progress interview and restart it
       await interviewsTable.openActionsDropdown(0);
       await authenticatedPage.click('[data-testid="restart-action"]');

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Restart Interview');
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-message"]'),
       ).toContainText('This will reset all progress');

       // Confirm restart
       await authenticatedPage.click('[data-testid="confirm-restart"]');

       // Verify interview was restarted (progress should be reset)
       await authenticatedPage.waitForTimeout(1000);
       const progressText = await authenticatedPage
         .locator(
           '[data-testid="interviews-table"] tbody tr:first-child [data-testid="progress-text"]',
         )
         .textContent();
       expect(progressText).toContain('0%');
     });
   });
   ```

**Verification**: Run interviews tests to ensure all interview management features work correctly.

## Task 5.5: Settings Page Testing

**Objective**: Test application settings management, including UploadThing configuration, analytics settings, and other system configurations.

**Steps**:

1. **Create settings tests**:

   ```bash
   touch tests/e2e/dashboard/settings.spec.ts
   ```

2. **Add comprehensive settings tests**:

   ```typescript
   // tests/e2e/dashboard/settings.spec.ts
   import { test, expect } from '../fixtures';
   import { FormComponent } from '../page-objects/components';

   test.describe('Settings Management', () => {
     test.beforeEach(async ({ dashboardData }) => {
       // Use dashboard data for settings testing
     });

     test('should display settings page with all sections', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToSettings();

       // Verify main settings form is visible
       await expect(
         authenticatedPage.locator('[data-testid="settings-form"]'),
       ).toBeVisible();

       // Verify all settings sections
       const settingSections = [
         'general-settings',
         'uploadthing-settings',
         'analytics-settings',
         'advanced-settings',
       ];

       for (const section of settingSections) {
         await expect(
           authenticatedPage.locator(`[data-testid="${section}"]`),
         ).toBeVisible();
       }
     });

     test('should update UploadThing token', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       const settingsForm = new FormComponent(
         authenticatedPage,
         '[data-testid="settings-form"]',
       );

       // Update UploadThing token
       const newToken = `test-token-${Date.now()}`;
       await settingsForm.fillField('uploadThingToken', newToken);

       // Submit form
       await settingsForm.submit();

       // Verify success message
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toContainText('Settings updated');

       // Verify token was saved in database
       const setting = await db.appSettings.findUnique({
         where: { key: 'uploadThingToken' },
       });
       expect(setting?.value).toBe(newToken);
     });

     test('should validate UploadThing token format', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToSettings();

       const settingsForm = new FormComponent(
         authenticatedPage,
         '[data-testid="settings-form"]',
       );

       // Try invalid token format
       await settingsForm.fillField('uploadThingToken', 'invalid-token');
       await settingsForm.submit();

       // Verify validation error
       await expect(
         authenticatedPage.locator('[data-testid="error-uploadThingToken"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="error-uploadThingToken"]'),
       ).toContainText('Invalid token format');
     });

     test('should toggle analytics settings', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       // Get current analytics setting
       const initialSetting = await db.appSettings.findUnique({
         where: { key: 'disableAnalytics' },
       });
       const initiallyDisabled = initialSetting?.value === 'true';

       // Toggle analytics switch
       await authenticatedPage.click(
         '[data-testid="disable-analytics-switch"]',
       );

       // Submit form
       await authenticatedPage.click('[data-testid="save-button"]');

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();

       // Verify setting was toggled in database
       const updatedSetting = await db.appSettings.findUnique({
         where: { key: 'disableAnalytics' },
       });
       const nowDisabled = updatedSetting?.value === 'true';
       expect(nowDisabled).toBe(!initiallyDisabled);
     });

     test('should toggle interview limit settings', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       // Toggle limit interviews switch
       await authenticatedPage.click('[data-testid="limit-interviews-switch"]');

       // Verify limit input becomes visible
       await expect(
         authenticatedPage.locator('[data-testid="interview-limit-input"]'),
       ).toBeVisible();

       // Set interview limit
       await authenticatedPage.fill(
         '[data-testid="interview-limit-input"]',
         '100',
       );

       // Submit form
       await authenticatedPage.click('[data-testid="save-button"]');

       // Verify settings saved
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();

       // Verify in database
       const limitSetting = await db.appSettings.findUnique({
         where: { key: 'limitInterviews' },
       });
       expect(limitSetting?.value).toBe('true');
     });

     test('should update installation ID', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       // Click regenerate installation ID
       await authenticatedPage.click(
         '[data-testid="regenerate-installation-id"]',
       );

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Regenerate Installation ID');

       // Confirm regeneration
       await authenticatedPage.click('[data-testid="confirm-regenerate"]');

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toContainText('Installation ID regenerated');

       // Verify new ID is displayed
       const newId = await authenticatedPage
         .locator('[data-testid="installation-id-display"]')
         .textContent();
       expect(newId).toBeTruthy();
       expect(newId?.length).toBeGreaterThan(10);
     });

     test('should handle settings form validation', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToSettings();

       // Clear required field
       await authenticatedPage.fill('[name="uploadThingToken"]', '');

       // Try to submit
       await authenticatedPage.click('[data-testid="save-button"]');

       // Verify validation prevents submission
       await expect(
         authenticatedPage.locator('[data-testid="save-button"]'),
       ).toBeDisabled();

       // Fill valid value
       await authenticatedPage.fill(
         '[name="uploadThingToken"]',
         'valid-token-123',
       );

       // Verify submit button is enabled
       await expect(
         authenticatedPage.locator('[data-testid="save-button"]'),
       ).toBeEnabled();
     });

     test('should display current environment info', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToSettings();

       // Verify environment info section
       await expect(
         authenticatedPage.locator('[data-testid="environment-info"]'),
       ).toBeVisible();

       // Check for version info
       await expect(
         authenticatedPage.locator('[data-testid="app-version"]'),
       ).toBeVisible();
       const version = await authenticatedPage
         .locator('[data-testid="app-version"]')
         .textContent();
       expect(version).toMatch(/v\d+\.\d+\.\d+/);

       // Check for commit hash
       await expect(
         authenticatedPage.locator('[data-testid="commit-hash"]'),
       ).toBeVisible();
     });

     test('should handle readonly environment variables alert', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToSettings();

       // If readonly env alert is present, verify it's displayed correctly
       const readonlyAlert = authenticatedPage.locator(
         '[data-testid="readonly-env-alert"]',
       );

       if (await readonlyAlert.isVisible()) {
         await expect(readonlyAlert).toContainText('read-only');

         // Verify certain fields are disabled
         const uploadThingInput = authenticatedPage.locator(
           '[name="uploadThingToken"]',
         );
         await expect(uploadThingInput).toBeDisabled();
       }
     });

     test('should reset settings to defaults', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       // Make some changes first
       await authenticatedPage.fill(
         '[name="uploadThingToken"]',
         'modified-token',
       );
       await authenticatedPage.click(
         '[data-testid="disable-analytics-switch"]',
       );

       // Click reset to defaults
       await authenticatedPage.click('[data-testid="reset-defaults-button"]');

       // Verify confirmation modal
       await expect(
         authenticatedPage.locator('[data-testid="confirmation-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Reset to Defaults');

       // Confirm reset
       await authenticatedPage.click('[data-testid="confirm-reset"]');

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();

       // Verify form was reset
       const tokenValue = await authenticatedPage
         .locator('[name="uploadThingToken"]')
         .inputValue();
       expect(tokenValue).toBe(''); // Should be empty/default
     });

     test('should validate settings changes are persisted across sessions', async ({
       authenticatedPage,
       dashboardPage,
       page,
     }) => {
       await dashboardPage.navigateToSettings();

       // Make a change
       const testToken = `persistence-test-${Date.now()}`;
       await authenticatedPage.fill('[name="uploadThingToken"]', testToken);
       await authenticatedPage.click('[data-testid="save-button"]');

       // Wait for success
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toBeVisible();

       // Navigate away and back
       await dashboardPage.goto();
       await dashboardPage.navigateToSettings();

       // Verify change persisted
       const persistedValue = await authenticatedPage
         .locator('[name="uploadThingToken"]')
         .inputValue();
       expect(persistedValue).toBe(testToken);
     });

     test('should handle concurrent settings updates', async ({
       authenticatedPage,
       dashboardPage,
       db,
     }) => {
       await dashboardPage.navigateToSettings();

       // Simulate concurrent update via database
       await db.appSettings.upsert({
         where: { key: 'uploadThingToken' },
         update: { value: 'concurrent-update-token' },
         create: { key: 'uploadThingToken', value: 'concurrent-update-token' },
       });

       // Try to update from UI
       await authenticatedPage.fill(
         '[name="uploadThingToken"]',
         'ui-update-token',
       );
       await authenticatedPage.click('[data-testid="save-button"]');

       // Should handle conflict gracefully
       // The exact behavior depends on implementation - could show warning or auto-refresh
       await expect(
         authenticatedPage.locator(
           '[data-testid="success-message"], [data-testid="conflict-warning"]',
         ),
       ).toBeVisible();
     });
   });
   ```

**Verification**: Run settings tests to ensure all configuration management features work correctly.

## Phase 5 Completion Checklist

- [ ] Dashboard overview tests covering summary statistics and activity feed
- [ ] Navigation tests ensuring proper routing and state management
- [ ] Comprehensive protocols management tests (CRUD, upload, export, search, filter)
- [ ] Participants management tests (creation, import, URL generation, bulk operations)
- [ ] Interviews management tests (filtering, export, network analysis, status tracking)
- [ ] Settings tests covering all configuration options and validation
- [ ] Data integrity tests ensuring database operations work correctly
- [ ] Search and filter functionality tests across all modules
- [ ] Pagination and sorting tests for data tables
- [ ] Modal and form interaction tests
- [ ] Error handling and validation tests
- [ ] Bulk operations and selection tests

## Next Steps

After completing Phase 5, you should have:

- Comprehensive functional testing coverage for all dashboard routes
- Reliable tests for all CRUD operations
- Proper testing of data interactions and state management
- Foundation for detecting regressions in core functionality

Proceed to **PHASE-6.md** for setup route testing implementation.
