import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

test.describe.parallel('Dashboard Visual Snapshots', () => {
  test('Dashboard summary page should match visual snapshot', async ({
    page,
    snapshots,
  }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /dashboard/i }).first(),
    ).toBeVisible();
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('dashboard-summary'),
    );
  });

  test('Protocols page should match visual snapshot', async ({
    page,
    snapshots,
  }) => {
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Protocols', exact: true }),
    ).toBeVisible();
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('protocols-page'),
    );
  });

  test('Interviews page should match visual snapshot', async ({
    page,
    snapshots,
  }) => {
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Interviews', exact: true }),
    ).toBeVisible();
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('interviews-page'),
    );
  });

  test('Settings page should match visual snapshot', async ({
    page,
    snapshots,
  }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Settings', exact: true }),
    ).toBeVisible();
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('settings-page'),
    );
  });
});
