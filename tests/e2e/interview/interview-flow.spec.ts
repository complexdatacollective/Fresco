import { test, expect } from '../fixtures/test-fixtures';
import {
  InterviewPage,
  DashboardPage,
  LoginPage,
} from '../helpers/page-objects';

test.describe('Interview Flow', () => {
  let interviewPage: InterviewPage;
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, apiHelper, testUser }) => {
    // Setup test data
    await apiHelper.resetDatabase();
    await apiHelper.createUser();
    await apiHelper.createProtocol({
      name: 'Interview Test Protocol',
      stages: [
        { type: 'NameGenerator', label: 'Name People' },
        { type: 'Sociogram', label: 'Connect People' },
        { type: 'OrdinalBin', label: 'Categorize' },
      ],
    });

    // Login
    loginPage = new LoginPage(page);
    await loginPage.login(testUser.username, testUser.password);

    dashboardPage = new DashboardPage(page);
    interviewPage = new InterviewPage(page);
  });

  test('can start and navigate through interview', async ({ page }) => {
    // Go to dashboard and start interview
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Verify interview started
    await expect(page).toHaveURL(/\/interview\//);
    await expect(interviewPage.stageProgress).toBeVisible();

    // Navigate through stages
    await interviewPage.nextButton.click();
    await expect(page.locator('text=Connect People')).toBeVisible();

    await interviewPage.previousButton.click();
    await expect(page.locator('text=Name People')).toBeVisible();
  });

  test('can add nodes in name generator', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Add nodes
    await interviewPage.addNode('Person 1');
    await interviewPage.addNode('Person 2');

    // Verify nodes are added
    await expect(page.locator('text=Person 1')).toBeVisible();
    await expect(page.locator('text=Person 2')).toBeVisible();
  });

  test('can connect nodes in sociogram', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Add nodes first
    await interviewPage.addNode('Node A');
    await interviewPage.addNode('Node B');

    // Move to sociogram stage
    await interviewPage.nextButton.click();

    // Connect nodes
    await interviewPage.connectNodes('Node A', 'Node B');

    // Verify connection (edge) exists
    await expect(
      page.locator('[data-testid="edge-NodeA-NodeB"]'),
    ).toBeVisible();
  });

  test('can complete interview', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Navigate to last stage
    await interviewPage.navigateToStage(3);

    // Complete interview
    await interviewPage.completeInterview();

    // Should redirect to dashboard or completion page
    await expect(page).toHaveURL(/\/(dashboard|complete)/);
    await expect(page.locator('text=Interview completed')).toBeVisible();
  });

  test('visual regression - interview stages', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Take screenshots of each stage
    await expect(page).toHaveScreenshot('interview-stage-1.png', {
      fullPage: true,
      animations: 'disabled',
    });

    await interviewPage.nextButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('interview-stage-2.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('preserves data when navigating between stages', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.selectProtocol('Interview Test Protocol');
    await dashboardPage.startInterview();

    // Add data in first stage
    await interviewPage.addNode('Persistent Node');

    // Navigate forward and back
    await interviewPage.nextButton.click();
    await interviewPage.previousButton.click();

    // Verify data persists
    await expect(page.locator('text=Persistent Node')).toBeVisible();
  });
});
