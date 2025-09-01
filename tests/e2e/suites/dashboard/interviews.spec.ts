// import { expect, test, type Page } from '@playwright/test';
// import { type TestEnvironmentContext } from '../../fixtures/test-environment';

// async function loginAsAdmin(page: Page) {
//   await page.goto('/signin');
//   await page.fill('[name="username"], [type="text"]', 'admin');
//   await page.fill('[name="password"], [type="password"]', 'AdminPassword123!');
//   await page.click('[type="submit"], button:has-text("Login")');
//   await page.waitForURL(/\/(dashboard|protocols|home|interviews)/);
// }

// test.describe('Interview Management', () => {
//   let context: TestEnvironmentContext;

//   test.beforeAll(() => {
//     // Get the test environment context with snapshot capability
//     context = (global as any).__INTERVIEWS_CONTEXT__;
//   });

//   test.beforeEach(async ({ page }) => {
//     // Restore to initial state before each test
//     if (context) {
//       await context.restoreSnapshot('initial');
//     }
//     await loginAsAdmin(page);
//   });

//   test('should display interview dashboard', async ({ page }) => {
//     await page.goto('/interviews');

//     // Should show interviews overview
//     await expect(page.locator('h1, h2')).toContainText(/Interviews/i);

//     // Should display statistics
//     const stats = page.locator('[data-testid="interview-stats"], .stats-card');
//     await expect(stats.first()).toBeVisible();

//     // Should show interview list
//     const interviews = page.locator(
//       '[data-testid="interview-item"], .interview-row, tr[data-interview]',
//     );
//     await expect(interviews).toHaveCount(3); // Based on test data
//   });

//   test('should filter interviews by status', async ({ page }) => {
//     await page.goto('/interviews');

//     // Filter by completed
//     const filterSelect = page.locator(
//       'select[name="status"], [data-testid="status-filter"]',
//     );
//     await filterSelect.selectOption('completed');

//     // Should show only completed interviews
//     const interviews = page.locator(
//       '[data-testid="interview-item"], .interview-row',
//     );
//     await expect(interviews).toHaveCount(1);

//     // Filter by in-progress
//     await filterSelect.selectOption('in-progress');
//     await expect(interviews).toHaveCount(1);
//   });

//   test('should start a new interview', async ({ page }) => {
//     await page.goto('/interviews');

//     // Click new interview button
//     await page.click(
//       'button:has-text("New Interview"), a:has-text("Start Interview")',
//     );

//     // Select protocol
//     await expect(page.locator('h1, h2, h3')).toContainText(
//       /Select Protocol|Choose Protocol/i,
//     );
//     await page.click('text="Test Study Protocol"');

//     // Enter participant identifier
//     const participantInput = page.locator(
//       '[name="participantId"], [name="identifier"]',
//     );
//     await participantInput.fill(`P${Date.now()}`);

//     // Start interview
//     await page.click('button:has-text("Start"), button:has-text("Begin")');

//     // Should navigate to interview
//     await expect(page).toHaveURL(/\/interview\/[a-z0-9-]+/);

//     // Should show first stage
//     await expect(page.locator('.stage-title, h1, h2')).toContainText(
//       'Information',
//     );
//   });

//   test('should resume an in-progress interview', async ({ page }) => {
//     await page.goto('/interviews');

//     // Find and click on in-progress interview
//     const inProgressRow = page.locator(
//       'tr:has-text("Bob"), [data-testid="interview-item"]:has-text("Bob")',
//     );
//     await inProgressRow.click();

//     // Should navigate to interview
//     await expect(page).toHaveURL(/\/interview\/[a-z0-9-]+/);

//     // Should be at the correct step
//     await expect(page.locator('.stage-title, .current-stage')).toContainText(
//       'Name Generator',
//     );
//   });

//   test('should navigate through interview stages', async ({ page }) => {
//     // Start from an in-progress interview
//     await page.goto('/interviews');
//     const inProgressRow = page.locator('tr:has-text("Bob")').first();
//     await inProgressRow.click();

//     // Navigate to next stage
//     const nextButton = page.locator(
//       'button:has-text("Next"), button[aria-label="Next"]',
//     );
//     await nextButton.click();

//     // Should advance to next stage
//     await expect(
//       page.locator('.stage-progress, .progress-indicator'),
//     ).toContainText(/2|Stage 2/);

//     // Navigate back
//     const prevButton = page.locator(
//       'button:has-text("Previous"), button[aria-label="Previous"]',
//     );
//     await prevButton.click();

//     // Should go back to previous stage
//     await expect(
//       page.locator('.stage-progress, .progress-indicator'),
//     ).toContainText(/1|Stage 1/);
//   });

//   test('should complete an interview', async ({ page }) => {
//     // Resume Bob's interview
//     await page.goto('/interviews');
//     await page.locator('tr:has-text("Bob")').first().click();

//     // Navigate to the last stage
//     const nextButton = page.locator(
//       'button:has-text("Next"), button[aria-label="Next"]',
//     );
//     await nextButton.click(); // Go to stage 2

//     // Complete interview
//     const finishButton = page.locator(
//       'button:has-text("Finish"), button:has-text("Complete")',
//     );
//     await finishButton.click();

//     // Confirm completion
//     const confirmButton = page
//       .locator('button:has-text("Confirm"), button:has-text("Yes")')
//       .last();
//     if (await confirmButton.isVisible()) {
//       await confirmButton.click();
//     }

//     // Should redirect to interviews list
//     await expect(page).toHaveURL('/interviews');

//     // Interview should now show as completed
//     const completedInterview = page.locator('tr:has-text("Bob")');
//     await expect(completedInterview).toContainText(/Completed|Finished/i);
//   });

//   test('should export interview data', async ({ page }) => {
//     await page.goto('/interviews');

//     // Find completed interview
//     const completedRow = page.locator('tr:has-text("Alice")').first();

//     // Open actions menu
//     const menuButton = completedRow.locator(
//       'button[aria-label*="menu"], button:has-text("⋮")',
//     );
//     await menuButton.click();

//     // Click export
//     const [download] = await Promise.all([
//       page.waitForEvent('download'),
//       page.click(
//         '[role="menuitem"]:has-text("Export"), button:has-text("Export")',
//       ),
//     ]);

//     // Verify download
//     expect(download.suggestedFilename()).toMatch(/\.(json|csv|graphml)/);
//   });

//   test('should delete an interview', async ({ page }) => {
//     await page.goto('/interviews');

//     // Count initial interviews
//     const initialCount = await page
//       .locator('[data-testid="interview-item"], tr[data-interview]')
//       .count();

//     // Find an interview to delete
//     const interviewRow = page.locator('tr:has-text("Charlie")').first();

//     // Open actions menu
//     const menuButton = interviewRow.locator(
//       'button[aria-label*="menu"], button:has-text("⋮")',
//     );
//     await menuButton.click();

//     // Click delete
//     await page.click('[role="menuitem"]:has-text("Delete")');

//     // Confirm deletion
//     await page.click(
//       'button:has-text("Confirm"), button:has-text("Delete"):visible',
//     );

//     // Should show success message
//     await expect(page.locator('.toast, [role="alert"]')).toContainText(
//       /deleted/i,
//     );

//     // Interview count should decrease
//     const finalCount = await page
//       .locator('[data-testid="interview-item"], tr[data-interview]')
//       .count();
//     expect(finalCount).toBe(initialCount - 1);
//   });

//   test('should handle interview with network data', async ({ page }) => {
//     await page.goto('/interviews');

//     // Open Alice's completed interview
//     const aliceRow = page.locator('tr:has-text("Alice")').first();
//     await aliceRow.click();

//     // Should show network visualization or summary
//     await expect(
//       page.locator('.network-summary, [data-testid="network-viz"]'),
//     ).toBeVisible();

//     // Should display node count
//     await expect(page.getByText(/2 nodes|John|Jane/i)).toBeVisible();

//     // Should display edge count
//     await expect(page.getByText(/1 edge|1 relationship/i)).toBeVisible();
//   });
// });
