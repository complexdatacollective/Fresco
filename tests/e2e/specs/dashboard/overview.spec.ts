import { expect, expectURL, test } from '../../fixtures/test.js';

test.describe('Dashboard Overview', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests complete, before mutations start.
    // This reduces wait time for mutation tests that need exclusive locks.
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('displays dashboard heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Dashboard', level: 1 }),
      ).toBeVisible();
    });

    test('displays page header', async ({ page }) => {
      await expect(page.getByTestId('dashboard-page-header')).toBeVisible();
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
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('visual snapshot', async ({ capturePage }) => {
      await capturePage('dashboard-page');
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

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
  });
});
