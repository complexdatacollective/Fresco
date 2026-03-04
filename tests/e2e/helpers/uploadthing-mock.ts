import { type Page } from '@playwright/test';

const MOCK_UPLOAD_HOST = 'https://mock-uploadthing.test';

type MockPresigned = {
  url: string;
  key: string;
  customId: null;
};

/**
 * Intercepts UploadThing network requests at the browser level so protocol
 * imports with assets can succeed without a real UploadThing token.
 *
 * Mocks three request types:
 * 1. POST /api/uploadthing — presigned URL request (returns mock URLs)
 * 2. HEAD to mock upload URL — resume check (returns range-start 0)
 * 3. PUT to mock upload URL — file upload (returns success with mock ufsUrl)
 */
export async function mockUploadThing(page: Page) {
  // 1. Intercept the presigned URL request to our Next.js API
  await page.route('**/api/uploadthing**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      files: Array<{ name: string; size: number; type: string }>;
    };

    const presigneds: MockPresigned[] = body.files.map((file, i) => ({
      url: `${MOCK_UPLOAD_HOST}/upload/${i}/${encodeURIComponent(file.name)}`,
      key: `mock-key-${i}-${Date.now()}`,
      customId: null,
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(presigneds),
    });
  });

  // 2. Intercept HEAD requests (resume/range check)
  await page.route(`${MOCK_UPLOAD_HOST}/**`, async (route) => {
    const method = route.request().method();

    if (method === 'HEAD') {
      await route.fulfill({
        status: 200,
        headers: { 'x-ut-range-start': '0' },
      });
      return;
    }

    if (method === 'PUT') {
      // Extract the key from the presigned URL path
      const url = new URL(route.request().url());
      const segments = url.pathname.split('/');
      const index = segments[2] ?? '0';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          serverData: {},
          url: `${MOCK_UPLOAD_HOST}/f/mock-key-${index}`,
          appUrl: `${MOCK_UPLOAD_HOST}/f/mock-key-${index}`,
          ufsUrl: `${MOCK_UPLOAD_HOST}/f/mock-key-${index}`,
          fileHash: `mock-hash-${index}`,
        }),
      });
      return;
    }

    await route.fallback();
  });
}
