import { test, expect } from '../../fixtures/test.js';

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays dashboard heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }).first(),
    ).toBeVisible();
  });

  test('displays welcome message', async ({ page }) => {
    await expect(page.getByText(/Welcome to Fresco/)).toBeVisible();
  });

  test('displays summary statistics cards', async ({ page }) => {
    const statsGrid = page.locator('.grid a[href^="/dashboard/"]');
    await expect(statsGrid).toHaveCount(3);
  });

  test('shows correct protocol count', async ({ page }) => {
    const protocolCard = page.locator('a[href="/dashboard/protocols"]', {
      has: page.getByRole('heading', { level: 1 }),
    });
    await expect(protocolCard).toContainText('1');
  });

  test('shows correct participant count', async ({ page, database }) => {
    const cleanup = await database.isolate(page);
    try {
      const participantCard = page.locator(
        'a[href="/dashboard/participants"]',
        {
          has: page.getByRole('heading', { level: 1 }),
        },
      );
      await expect(participantCard).toContainText('10');
    } finally {
      await cleanup();
    }
  });

  test('shows correct interview count', async ({ page }) => {
    const interviewCard = page.locator('a[href="/dashboard/interviews"]', {
      has: page.getByRole('heading', { level: 1 }),
    });
    await expect(interviewCard).toContainText('5');
  });

  test('navigates to protocols from card', async ({ page }) => {
    await page.locator('a[href="/dashboard/protocols"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/protocols/);
  });

  test('navigates to participants from card', async ({ page }) => {
    await page.locator('a[href="/dashboard/participants"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/participants/);
  });

  test('navigates to interviews from card', async ({ page }) => {
    await page.locator('a[href="/dashboard/interviews"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/interviews/);
  });

  test('displays recent activity section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Recent Activity' }),
    ).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('visual snapshot', async ({ page, visual }) => {
    await visual();
    await expect(page).toHaveScreenshot('dashboard-page.png');
  });
});
