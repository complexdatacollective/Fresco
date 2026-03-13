import { createTestProtocol } from '../../fixtures/preview-protocol.js';
import { expect, expectURL, test } from '../../fixtures/test.js';

/**
 * Browser-based tests for preview mode.
 *
 * These tests run in the 'interview' environment which has:
 * - A configured app with seeded data
 * - No authentication storageState (preview doesn't require auth)
 *
 * Tests that are pure API calls (no browser navigation) are in specs/api/preview-mode.spec.ts
 */
test.describe('Preview Mode', () => {
  // All mutation tests share a worker-scoped database; run serially to avoid
  // concurrent restoreSnapshot() calls stomping on each other.
  test.describe.configure({ mode: 'serial' });

  test('preview URL redirects to error when disabled', async ({ page }) => {
    await page.goto('/preview/non-existent-id');
    await expectURL(page, /\/onboard\/error/);
  });

  test('preview interview renders with correct theme', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);
    const protocolId = await database.createPreviewProtocol();

    await page.goto(`/preview/${protocolId}/interview`);
  });

  test('valid preview URL redirects to interview', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);
    const protocolId = await database.createPreviewProtocol();

    await page.goto(`/preview/${protocolId}`);

    // Should redirect to interview page
    await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));
  });

  test('pending protocol redirects to error', async ({ page, database }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);
    const protocolId = await database.createPreviewProtocol({
      isPending: true,
    });

    await page.goto(`/preview/${protocolId}`);

    await expectURL(page, /\/onboard\/error/);
  });

  test('non-existent protocol redirects to error', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);

    await page.goto('/preview/non-existent-protocol-id');

    await expectURL(page, /\/onboard\/error/);
  });

  test('preview interview does not persist data', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);
    const protocolId = await database.createPreviewProtocol();

    const countBefore = await database.getInterviewCount();

    await page.goto(`/preview/${protocolId}/interview`, {
      waitUntil: 'load',
    });

    // Wait for interview to load - interview layout renders <main data-interview>
    await expect(page.locator('main[data-interview]')).toBeVisible({
      timeout: 15_000,
    });

    // Verify no new Interview records were created
    const countAfter = await database.getInterviewCount();
    expect(countAfter).toBe(countBefore);
  });

  test('preview mode disabled redirects to error', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    // Create protocol first, then disable preview mode
    await database.enablePreviewMode(false);
    const protocolId = await database.createPreviewProtocol();
    await database.disablePreviewMode();

    await page.goto(`/preview/${protocolId}`);

    await expectURL(page, /\/onboard\/error/);
  });

  test('abort-preview removes the protocol', async ({ page, database }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);

    // Create a preview protocol via API
    const initResponse = await page.request.post('/api/v1/preview', {
      data: {
        type: 'initialize-preview',
        protocol: createTestProtocol({ name: 'To Be Aborted' }),
        assetMeta: [],
      },
    });
    expect(initResponse.status()).toBe(200);
    const { previewUrl } = (await initResponse.json()) as {
      previewUrl: string;
    };
    const protocolId = previewUrl.split('/preview/')[1];

    // Abort the preview
    const abortResponse = await page.request.post('/api/v1/preview', {
      data: { type: 'abort-preview', protocolId },
    });
    expect(abortResponse.status()).toBe(200);
    const abortBody = (await abortResponse.json()) as { status: string };
    expect(abortBody.status).toBe('removed');

    // Verify it's gone - accessing should redirect to error
    await page.goto(`/preview/${protocolId}`);
    await expectURL(page, /\/onboard\/error/);
  });

  test('complete-preview marks pending protocol as ready', async ({
    page,
    database,
  }) => {
    await database.restoreSnapshot();
    await database.enablePreviewMode(false);
    // Create a pending protocol (simulating asset upload in progress)
    const protocolId = await database.createPreviewProtocol({
      isPending: true,
    });

    const response = await page.request.post('/api/v1/preview', {
      data: {
        type: 'complete-preview',
        protocolId,
      },
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      status: string;
      previewUrl: string;
    };
    expect(body.status).toBe('ready');
    expect(body.previewUrl).toContain(`/preview/${protocolId}`);

    // Verify the protocol is now accessible
    await page.goto(`/preview/${protocolId}`);
    await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));
  });
});
