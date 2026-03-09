import { expect, test, expectURL } from '../../fixtures/test.js';
import {
  createTestProtocol,
  createTestAssetMeta,
  INVALID_PROTOCOL,
} from '../../fixtures/preview-protocol.js';

test.describe('Preview Mode', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  // ============================================================
  // READ-ONLY TESTS: Preview mode disabled (default state)
  // ============================================================
  test.describe('Read-only', () => {
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('preview URL redirects to error when disabled', async ({ page }) => {
      await page.goto('/preview/non-existent-id');
      await expectURL(page, /\/onboard\/error/);
    });

    test('API returns 403 when preview mode disabled', async ({
      unauthenticatedRequest,
    }) => {
      const response = await unauthenticatedRequest.post('/api/v1/preview', {
        data: {
          type: 'initialize-preview',
          protocol: createTestProtocol(),
          assetMeta: [],
        },
      });
      expect(response.status()).toBe(403);
    });
  });

  // ============================================================
  // MUTATION TESTS
  // ============================================================
  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('preview interview renders with correct theme', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        await page.goto(`/preview/${protocolId}/interview`);

        // Should have interview theme applied
        const main = page.locator('main[data-theme="interview"]');
        await expect(main).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('valid preview URL redirects to interview', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        await page.goto(`/preview/${protocolId}`);

        // Should redirect to interview page
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));
      } finally {
        await cleanup();
      }
    });

    test('pending protocol redirects to error', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol({
          isPending: true,
        });

        await page.goto(`/preview/${protocolId}`);

        await expectURL(page, /\/onboard\/error/);
      } finally {
        await cleanup();
      }
    });

    test('non-existent protocol redirects to error', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        await page.goto('/preview/non-existent-protocol-id');

        await expectURL(page, /\/onboard\/error/);
      } finally {
        await cleanup();
      }
    });

    test('preview interview does not persist data', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        const countBefore = await database.getInterviewCount();

        await page.goto(`/preview/${protocolId}/interview`);

        // Wait for interview to load
        const main = page.locator('main[data-theme="interview"]');
        await expect(main).toBeVisible();

        // Verify no new Interview records were created
        const countAfter = await database.getInterviewCount();
        expect(countAfter).toBe(countBefore);
      } finally {
        await cleanup();
      }
    });

    test('preview mode disabled redirects to error', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        // Create protocol first, then disable preview mode
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();
        await database.disablePreviewMode();

        await page.goto(`/preview/${protocolId}`);

        await expectURL(page, /\/onboard\/error/);
      } finally {
        await cleanup();
      }
    });

    // ----------------------------------------------------------
    // Authentication Tests
    // ----------------------------------------------------------

    test('API returns 401 when auth required and no credentials', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(true); // requireAuth = true

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: [],
          },
        });

        expect(response.status()).toBe(401);
      } finally {
        await cleanup();
      }
    });

    test('API succeeds without auth when auth not required', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false); // No auth required

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: [],
          },
        });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as { status: string };
        expect(body.status).toBe('ready');
      } finally {
        await cleanup();
      }
    });

    // ----------------------------------------------------------
    // API Happy Path Tests
    // ----------------------------------------------------------

    test('valid protocol without assets returns ready status', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: [],
          },
        });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as { status: string; previewUrl: string };
        expect(body.status).toBe('ready');
        expect(body.previewUrl).toBeTruthy();
      } finally {
        await cleanup();
      }
    });

    test('duplicate protocol returns existing preview URL', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocol = createTestProtocol({ name: 'Duplicate Test' });

        // First request
        const response1 = await unauthenticatedRequest.post('/api/v1/preview', {
          data: { type: 'initialize-preview', protocol, assetMeta: [] },
        });
        expect(response1.status()).toBe(200);
        const body1 = (await response1.json()) as { previewUrl: string };
        const firstUrl = body1.previewUrl;

        // Second request with same protocol
        const response2 = await unauthenticatedRequest.post('/api/v1/preview', {
          data: { type: 'initialize-preview', protocol, assetMeta: [] },
        });
        expect(response2.status()).toBe(200);
        const body2 = (await response2.json()) as { previewUrl: string };

        // Should return same URL (protocol hash match)
        expect(body2.previewUrl).toBe(firstUrl);
      } finally {
        await cleanup();
      }
    });

    test('abort-preview removes the protocol', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        // Create a preview protocol
        const initResponse = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol({ name: 'To Be Aborted' }),
            assetMeta: [],
          },
        });
        expect(initResponse.status()).toBe(200);
        const { previewUrl } = (await initResponse.json()) as { previewUrl: string };
        const protocolId = previewUrl.split('/preview/')[1];

        // Abort the preview
        const abortResponse = await unauthenticatedRequest.post('/api/v1/preview', {
          data: { type: 'abort-preview', protocolId },
        });
        expect(abortResponse.status()).toBe(200);
        const abortBody = (await abortResponse.json()) as { status: string };
        expect(abortBody.status).toBe('removed');

        // Verify it's gone - accessing should redirect to error
        await page.goto(`/preview/${protocolId}`);
        await expectURL(page, /\/onboard\/error/);
      } finally {
        await cleanup();
      }
    });

    // ----------------------------------------------------------
    // Validation Tests
    // ----------------------------------------------------------

    test('invalid protocol schema returns 400', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: INVALID_PROTOCOL,
            assetMeta: [],
          },
        });

        expect(response.status()).toBe(400);
        const body = (await response.json()) as { status: string };
        expect(body.status).toBe('rejected');
      } finally {
        await cleanup();
      }
    });

    // ----------------------------------------------------------
    // Asset Upload Tests
    // ----------------------------------------------------------

    test('protocol with assets returns 500 when UploadThing not configured', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        // Note: The default TEST_TOKEN is not valid base64 JSON,
        // so parseUploadThingToken() returns null

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: createTestAssetMeta(1),
          },
        });

        expect(response.status()).toBe(500);
        const body = (await response.json()) as { status: string; message: string };
        expect(body.status).toBe('error');
        expect(body.message).toBe('UploadThing not configured');
      } finally {
        await cleanup();
      }
    });

    test('complete-preview marks pending protocol as ready', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        // Create a pending protocol (simulating asset upload in progress)
        const protocolId = await database.createPreviewProtocol({
          isPending: true,
        });

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'complete-preview',
            protocolId,
          },
        });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as { status: string; previewUrl: string };
        expect(body.status).toBe('ready');
        expect(body.previewUrl).toContain(`/preview/${protocolId}`);

        // Verify the protocol is now accessible
        await page.goto(`/preview/${protocolId}`);
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));
      } finally {
        await cleanup();
      }
    });

    test('complete-preview returns 404 for non-existent protocol', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'complete-preview',
            protocolId: 'non-existent-protocol-id',
          },
        });

        expect(response.status()).toBe(404);
        const body = (await response.json()) as { status: string };
        expect(body.status).toBe('error');
      } finally {
        await cleanup();
      }
    });

    test('abort-preview returns 404 for non-existent protocol', async ({
      page,
      database,
      unauthenticatedRequest,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await unauthenticatedRequest.post('/api/v1/preview', {
          data: {
            type: 'abort-preview',
            protocolId: 'non-existent-protocol-id',
          },
        });

        expect(response.status()).toBe(404);
        const body = (await response.json()) as { status: string };
        expect(body.status).toBe('error');
      } finally {
        await cleanup();
      }
    });
  });
});
