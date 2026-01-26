import { type Page } from '@playwright/test';

/**
 * Mock UploadThing API routes for E2E testing.
 * This prevents actual file uploads and API calls during tests.
 */
export async function mockUploadThing(page: Page) {
  // Mock the UploadThing presigned URL endpoint
  await page.route('**/api/uploadthing**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          url: 'https://mock-ut.local/upload',
          key: 'mock-key-' + Date.now(),
          ufsUrl: 'https://mock-ut.local/files/mock-key',
          name: 'uploaded-file',
          size: 1000,
        },
      ]),
    });
  });

  // Mock the actual file upload destination
  await page.route('https://mock-ut.local/**', async (route) => {
    await route.fulfill({ status: 200, body: '{"success":true}' });
  });

  // Mock any UploadThing CDN URLs
  await page.route('**/utfs.io/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });
}
