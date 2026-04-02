import { test, expect } from '../../fixtures/test.js';
import {
  createTestProtocol,
  createTestAssetMeta,
  INVALID_PROTOCOL,
} from '../../helpers/previewProtocol.js';
import { AppSetting } from '~/lib/db/generated/enums';

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
  // All tests share a worker-scoped database; run serially to avoid
  // concurrent restoreSnapshot() calls stomping on each other.
  test.describe.configure({ mode: 'serial' });

  // ============================================================
  // READ-ONLY TESTS: Preview mode disabled (default state)
  // ============================================================
  test.describe('Preview mode disabled', () => {
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
    test('returns 401 when auth required and no credentials', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'true');

      const response = await request.post('/api/v1/preview', {
        data: {
          type: 'initialize-preview',
          protocol: createTestProtocol(),
          assetMeta: [],
        },
      });

      expect(response.status()).toBe(401);
    });

    test('succeeds with valid API token when auth required', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'true');
      const token = await app.createApiToken('e2e-test-token');

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
    });

    test('succeeds without auth when auth not required', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

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
    });

    test('valid protocol without assets returns ready status', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

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
    });

    test('duplicate protocol returns existing preview URL', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');
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
    });

    test('invalid protocol schema returns 400', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

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
    });

    test('protocol with assets returns 500 when UploadThing not configured', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

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
      expect(body.message).toBe('Failed to process preview request');
    });

    test('complete-preview returns 404 for non-existent protocol', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

      const response = await request.post('/api/v1/preview', {
        data: {
          type: 'complete-preview',
          protocolId: 'non-existent-protocol-id',
        },
      });

      expect(response.status()).toBe(404);
      const body = (await response.json()) as { status: string };
      expect(body.status).toBe('error');
    });

    test('abort-preview returns 404 for non-existent protocol', async ({
      request,
      database,
      app,
    }) => {
      await database.restoreSnapshot();
      await app.setSetting(AppSetting.previewMode, 'true');
      await app.setSetting(AppSetting.previewModeRequireAuth, 'false');

      const response = await request.post('/api/v1/preview', {
        data: {
          type: 'abort-preview',
          protocolId: 'non-existent-protocol-id',
        },
      });

      expect(response.status()).toBe(404);
      const body = (await response.json()) as { status: string };
      expect(body.status).toBe('error');
    });
  });
});
