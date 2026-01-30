import { expect, expectURL, test } from '../../fixtures/test.js';

test.describe('Dashboard Overview', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.afterAll(async ({ database }) => {
    await database.releaseReadLock();
  });

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
    await expect(page.getByTestId('stat-card-protocols')).toBeVisible();
    await expect(page.getByTestId('stat-card-participants')).toBeVisible();
    await expect(page.getByTestId('stat-card-interviews')).toBeVisible();
  });

  test('shows correct protocol count', async ({ page }) => {
    const card = page.getByTestId('stat-card-protocols');
    const count = card.getByRole('heading', { level: 1 });
    await expect(count).toHaveText('1');
  });

  test('shows correct participant count', async ({ page, database }) => {
    const cleanup = await database.isolate(page);
    try {
      const card = page.getByTestId('stat-card-participants');
      const count = card.getByRole('heading', { level: 1 });
      await expect(count).toHaveText('10');
    } finally {
      await cleanup();
    }
  });

  test('shows correct interview count', async ({ page }) => {
    const card = page.getByTestId('stat-card-interviews');
    const count = card.getByRole('heading', { level: 1 });
    await expect(count).toHaveText('5');
  });

  test('navigates to protocols from card', async ({ page }) => {
    const card = page.getByTestId('stat-card-protocols');
    await expect(card.getByRole('heading', { level: 1 })).toBeVisible();
    await card.click();
    await expectURL(page, /\/dashboard\/protocols/);
  });

  test('navigates to participants from card', async ({ page }) => {
    const card = page.getByTestId('stat-card-participants');
    await expect(card.getByRole('heading', { level: 1 })).toBeVisible();
    await card.click();
    await expectURL(page, /\/dashboard\/participants/);
  });

  test('navigates to interviews from card', async ({ page }) => {
    const card = page.getByTestId('stat-card-interviews');
    await expect(card.getByRole('heading', { level: 1 })).toBeVisible();
    await card.click();
    await expectURL(page, /\/dashboard\/interviews/);
  });

  test('displays recent activity section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Recent Activity' }),
    ).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('visual snapshot', async ({ capturePage }) => {
    await capturePage('dashboard-page');
  });
});
