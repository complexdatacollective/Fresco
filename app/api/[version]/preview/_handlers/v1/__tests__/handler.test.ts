import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const {
  mockCheckPreviewAuth,
  mockValidateAndMigrateProtocol,
  mockPrunePreviewProtocols,
  mockPrisma,
  mockGetExistingAssets,
  mockParseUploadThingToken,
  mockGeneratePresignedUploadUrl,
  mockRegisterUploadWithUploadThing,
  mockGetUTApi,
  mockDeleteFiles,
  mockAddEvent,
  mockCaptureException,
  mockExtractApikeyAssetsFromManifest,
} = vi.hoisted(() => ({
  mockCheckPreviewAuth: vi.fn(),
  mockValidateAndMigrateProtocol: vi.fn(),
  mockPrunePreviewProtocols: vi.fn(),
  mockPrisma: {
    previewProtocol: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    asset: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  mockGetExistingAssets: vi.fn(),
  mockParseUploadThingToken: vi.fn(),
  mockGeneratePresignedUploadUrl: vi.fn(),
  mockRegisterUploadWithUploadThing: vi.fn(),
  mockGetUTApi: vi.fn(),
  mockDeleteFiles: vi.fn(),
  mockAddEvent: vi.fn(),
  mockCaptureException: vi.fn(),
  mockExtractApikeyAssetsFromManifest: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, after: vi.fn() };
});

vi.mock('../helpers', async () => {
  const { NextResponse } = await import('next/server');
  return {
    checkPreviewAuth: mockCheckPreviewAuth,
    jsonResponse: (data: unknown, status = 200) =>
      NextResponse.json(data, { status }),
    corsHeaders: {},
  };
});

vi.mock('~/actions/activityFeed', () => ({
  addEvent: mockAddEvent,
}));

vi.mock('~/actions/preview-protocol-pruning', () => ({
  prunePreviewProtocols: mockPrunePreviewProtocols,
}));

vi.mock('~/env', () => ({
  env: { PUBLIC_URL: 'http://localhost:3000' },
}));

vi.mock('~/lib/db', () => ({
  prisma: mockPrisma,
}));

vi.mock('~/lib/db/generated/client', () => ({
  Prisma: { JsonNull: null },
}));

vi.mock('~/lib/posthog-server', () => ({
  captureException: mockCaptureException,
  shutdownPostHog: vi.fn(),
}));

vi.mock('~/lib/protocol/validateAndMigrateProtocol', () => ({
  validateAndMigrateProtocol: mockValidateAndMigrateProtocol,
}));

vi.mock('~/lib/uploadthing/presigned', () => ({
  generatePresignedUploadUrl: mockGeneratePresignedUploadUrl,
  parseUploadThingToken: mockParseUploadThingToken,
  registerUploadWithUploadThing: mockRegisterUploadWithUploadThing,
}));

vi.mock('~/lib/uploadthing/server-helpers', () => ({
  getUTApi: mockGetUTApi,
}));

vi.mock('~/queries/protocols', () => ({
  getExistingAssets: mockGetExistingAssets,
}));

vi.mock('~/utils/ensureError', () => ({
  ensureError: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
}));

vi.mock('~/utils/getBaseUrl', () => ({
  getBaseUrl: () => 'http://localhost:3000',
}));

vi.mock('~/utils/protocolImport', () => ({
  extractApikeyAssetsFromManifest: mockExtractApikeyAssetsFromManifest,
}));

import { v1 } from '../handler';

type JsonBody = {
  status: string;
  message?: string;
  previewUrl?: string;
  protocolId?: string;
  presignedUrls?: { assetId: string; url: string }[];
};

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/preview', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validProtocol = {
  schemaVersion: 7,
  stages: [],
  codebook: {},
  description: 'Test protocol',
  lastModified: '2024-01-01T00:00:00.000Z',
};

describe('Preview API v1 handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPreviewAuth.mockResolvedValue(null);
    mockPrunePreviewProtocols.mockResolvedValue({ deletedCount: 0 });
    mockExtractApikeyAssetsFromManifest.mockReturnValue([]);
    mockGetExistingAssets.mockResolvedValue([]);
    mockAddEvent.mockResolvedValue({ success: true, error: null });
  });

  describe('authentication', () => {
    it('should return auth error when preview auth fails', async () => {
      mockCheckPreviewAuth.mockResolvedValue({
        response: { status: 'error', message: 'Preview mode is not enabled' },
        status: 403,
      });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(403);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Preview mode is not enabled');
    });

    it('should return 401 when auth requires token and none provided', async () => {
      mockCheckPreviewAuth.mockResolvedValue({
        response: {
          status: 'error',
          message: 'Authentication required. Provide session or API token.',
        },
        status: 401,
      });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      const response = await v1(request);

      expect(response.status).toBe(401);
    });
  });

  describe('initialize-preview', () => {
    it('should reject invalid protocols', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({ success: false });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: { invalid: true },
        assetMeta: [],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(400);
      expect(body.status).toBe('rejected');
    });

    it('should return ready when protocol already exists', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue({
        id: 'existing-id',
      });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('ready');
      expect(body.previewUrl).toContain('/preview/existing-id');
    });

    it('should create protocol and return ready when no assets needed', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue(null);
      mockPrisma.previewProtocol.create.mockResolvedValue({
        id: 'new-protocol-id',
      });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('ready');
      expect(body.previewUrl).toContain('/preview/new-protocol-id');
      expect(mockPrisma.previewProtocol.create).toHaveBeenCalled();
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Preview Mode',
        'Preview protocol upload initiated',
      );
    });

    it('should return job-created with presigned URLs when assets need uploading', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue(null);
      mockPrisma.previewProtocol.create.mockResolvedValue({
        id: 'new-protocol-id',
      });
      mockParseUploadThingToken.mockResolvedValue({ apiKey: 'test-key' });
      mockGeneratePresignedUploadUrl.mockReturnValue({
        uploadUrl: 'https://upload.example.com/file',
        fileKey: 'file-key-1',
        fileUrl: 'https://cdn.example.com/file',
      });
      mockRegisterUploadWithUploadThing.mockResolvedValue(undefined);

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [{ assetId: 'asset-1', name: 'image.png', size: 1024 }],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('job-created');
      expect(body.protocolId).toBe('new-protocol-id');
      expect(body.presignedUrls).toHaveLength(1);
      expect(body.presignedUrls![0]!.assetId).toBe('asset-1');
    });

    it('should return error when UploadThing is not configured', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue(null);
      mockParseUploadThingToken.mockResolvedValue(null);

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [{ assetId: 'asset-1', name: 'image.png', size: 1024 }],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(500);
      expect(body.status).toBe('error');
      expect(body.message).toBe('UploadThing not configured');
    });

    it('should prune old preview protocols before creating new ones', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue(null);
      mockPrisma.previewProtocol.create.mockResolvedValue({
        id: 'new-id',
      });

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      await v1(request);

      expect(mockPrunePreviewProtocols).toHaveBeenCalled();
    });

    it('should skip uploading for already-existing assets', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockResolvedValue(null);
      mockPrisma.previewProtocol.create.mockResolvedValue({
        id: 'new-id',
      });
      mockGetExistingAssets.mockResolvedValue([{ assetId: 'asset-1' }]);

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [{ assetId: 'asset-1', name: 'image.png', size: 1024 }],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('ready');
      expect(mockParseUploadThingToken).not.toHaveBeenCalled();
    });
  });

  describe('complete-preview', () => {
    it('should mark protocol as complete and return preview URL', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue({
        id: 'protocol-1',
        name: 'Test Protocol',
      });
      mockPrisma.previewProtocol.update.mockResolvedValue({});

      const request = createPostRequest({
        type: 'complete-preview',
        protocolId: 'protocol-1',
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('ready');
      expect(body.previewUrl).toContain('/preview/protocol-1');
      expect(mockPrisma.previewProtocol.update).toHaveBeenCalledWith({
        where: { id: 'protocol-1' },
        data: { importedAt: expect.any(Date) as Date, isPending: false },
      });
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Preview Mode',
        'Preview protocol upload completed',
      );
    });

    it('should return 404 when protocol not found', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue(null);

      const request = createPostRequest({
        type: 'complete-preview',
        protocolId: 'nonexistent',
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(404);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Preview job not found');
    });
  });

  describe('abort-preview', () => {
    it('should delete protocol and return removed status', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue({
        id: 'protocol-1',
        name: 'Test Protocol',
      });
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.previewProtocol.delete.mockResolvedValue({});

      const request = createPostRequest({
        type: 'abort-preview',
        protocolId: 'protocol-1',
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(200);
      expect(body.status).toBe('removed');
      expect(mockPrisma.previewProtocol.delete).toHaveBeenCalledWith({
        where: { id: 'protocol-1' },
      });
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Protocol Uninstalled',
        'Preview protocol "Test Protocol" was aborted and removed',
      );
    });

    it('should return 404 when protocol not found', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue(null);

      const request = createPostRequest({
        type: 'abort-preview',
        protocolId: 'nonexistent',
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(404);
      expect(body.status).toBe('error');
    });

    it('should delete assets from UploadThing and database', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue({
        id: 'protocol-1',
        name: 'Test Protocol',
      });
      mockPrisma.asset.findMany.mockResolvedValue([
        { key: 'ut-key-1' },
        { key: 'ut-key-2' },
      ]);
      mockGetUTApi.mockResolvedValue({ deleteFiles: mockDeleteFiles });
      mockDeleteFiles.mockResolvedValue({ success: true });
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.previewProtocol.delete.mockResolvedValue({});

      const request = createPostRequest({
        type: 'abort-preview',
        protocolId: 'protocol-1',
      });

      await v1(request);

      expect(mockDeleteFiles).toHaveBeenCalledWith(['ut-key-1', 'ut-key-2']);
      expect(mockPrisma.asset.deleteMany).toHaveBeenCalledWith({
        where: { key: { in: ['ut-key-1', 'ut-key-2'] } },
      });
    });

    it('should continue even if UploadThing delete fails', async () => {
      mockPrisma.previewProtocol.findUnique.mockResolvedValue({
        id: 'protocol-1',
        name: 'Test Protocol',
      });
      mockPrisma.asset.findMany.mockResolvedValue([{ key: 'ut-key-1' }]);
      mockGetUTApi.mockRejectedValue(new Error('UploadThing API error'));
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.previewProtocol.delete.mockResolvedValue({});

      const request = createPostRequest({
        type: 'abort-preview',
        protocolId: 'protocol-1',
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(body.status).toBe('removed');
      expect(mockPrisma.previewProtocol.delete).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 and capture exception on unexpected errors', async () => {
      mockValidateAndMigrateProtocol.mockResolvedValue({
        success: true,
        protocol: validProtocol,
      });
      mockPrisma.previewProtocol.findFirst.mockRejectedValue(
        new Error('Database connection lost'),
      );

      const request = createPostRequest({
        type: 'initialize-preview',
        protocol: validProtocol,
        assetMeta: [],
      });

      const response = await v1(request);
      const body = (await response.json()) as JsonBody;

      expect(response.status).toBe(500);
      expect(body.status).toBe('error');
      expect(body.message).toBe('Failed to process preview request');
      expect(mockCaptureException).toHaveBeenCalled();
    });
  });
});
