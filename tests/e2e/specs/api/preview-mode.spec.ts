import { test, expect } from '../../fixtures/api-test.js';
import {
  createTestProtocol,
  createTestAssetMeta,
  INVALID_PROTOCOL,
} from '../../fixtures/preview-protocol.js';

/**
 * API-only tests for preview mode.
 *
 * These tests run in the 'api' environment which has:
 * - A configured app with seeded data (same as dashboard)
 * - No authentication storageState
 *
 * This allows testing unauthenticated API requests without workarounds.
 * Tests that need browser navigation verification stay in dashboard/.
 */
test.describe('Preview Mode API', () => {
  // ============================================================
  // READ-ONLY TESTS: Preview mode disabled (default state)
  // ============================================================
  test.describe('Preview mode disabled', () => {
    test.beforeAll(async ({ database }) => {
      await database.restoreSnapshot();
    });

    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('returns 403 when preview mode is disabled', async ({ request }) => {
      const response = await request.post('/api/v1/preview', {
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
  // MUTATION TESTS: Preview mode enabled
  // ============================================================
  test.describe('With preview mode enabled', () => {
    test.describe.configure({ mode: 'serial' });

    test('returns 401 when auth required and no credentials', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(true); // requireAuth = true

        const response = await request.post('/api/v1/preview', {
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

    test('succeeds with valid API token when auth required', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(true); // requireAuth = true
        const token = await database.createApiToken('e2e-test-token');

        const response = await request.post('/api/v1/preview', {
          headers: { Authorization: `Bearer ${token}` },
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

    test('succeeds without auth when auth not required', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false); // No auth required

        const response = await request.post('/api/v1/preview', {
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

    test('valid protocol without assets returns ready status', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await request.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: [],
          },
        });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as {
          status: string;
          previewUrl: string;
        };
        expect(body.status).toBe('ready');
        expect(body.previewUrl).toBeTruthy();
      } finally {
        await cleanup();
      }
    });

    test('duplicate protocol returns existing preview URL', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocol = createTestProtocol({ name: 'Duplicate Test' });

        // First request
        const response1 = await request.post('/api/v1/preview', {
          data: { type: 'initialize-preview', protocol, assetMeta: [] },
        });
        expect(response1.status()).toBe(200);
        const body1 = (await response1.json()) as { previewUrl: string };
        const firstUrl = body1.previewUrl;

        // Second request with same protocol
        const response2 = await request.post('/api/v1/preview', {
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

    test('invalid protocol schema returns 400', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await request.post('/api/v1/preview', {
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

    test('protocol with assets returns 500 when UploadThing not configured', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);
        // Note: The default TEST_TOKEN is not valid base64 JSON,
        // so parseUploadThingToken() returns null

        const response = await request.post('/api/v1/preview', {
          data: {
            type: 'initialize-preview',
            protocol: createTestProtocol(),
            assetMeta: createTestAssetMeta(1),
          },
        });

        expect(response.status()).toBe(500);
        const body = (await response.json()) as {
          status: string;
          message: string;
        };
        expect(body.status).toBe('error');
        expect(body.message).toBe('UploadThing not configured');
      } finally {
        await cleanup();
      }
    });

    test('complete-preview returns 404 for non-existent protocol', async ({
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await request.post('/api/v1/preview', {
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
      request,
      database,
    }, testInfo) => {
      const cleanup = await database.isolateApi(testInfo);
      try {
        await database.enablePreviewMode(false);

        const response = await request.post('/api/v1/preview', {
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
