import { expect, test } from '../../fixtures/test.js';

test.describe('Onboard Integration', () => {
  test('invalid protocol ID redirects to error page', async ({ page }) => {
    await page.goto('/onboard/nonexistent-id');
    await page.waitForURL('**/onboard/error');
    expect(page.url()).toContain('/onboard/error');
  });
});
