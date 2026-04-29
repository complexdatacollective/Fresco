import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateProtocolsToV8 } from '~/scripts/migrate-protocols-to-v8';

const mockDeleteFiles = vi.fn().mockResolvedValue({ success: true });
vi.mock('uploadthing/server', () => ({
  UTApi: vi.fn(function () {
    return { deleteFiles: mockDeleteFiles };
  }),
}));

const mockS3Send = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function () {
    return { send: mockS3Send };
  }),
  DeleteObjectsCommand: vi.fn(function (input: unknown) {
    return { input };
  }),
}));

type MockPrisma = {
  asset: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  previewProtocol: { deleteMany: ReturnType<typeof vi.fn> };
  protocol: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  appSettings: { findMany: ReturnType<typeof vi.fn> };
};

function makeMockPrisma(): MockPrisma {
  return {
    asset: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    previewProtocol: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    protocol: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    appSettings: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

describe('migrateProtocolsToV8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteFiles.mockResolvedValue({ success: true });
    mockS3Send.mockResolvedValue({});
  });

  it('is a no-op when there are no preview protocols and no v7 protocols', async () => {
    const prisma = makeMockPrisma();

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.previewProtocol.deleteMany).toHaveBeenCalledWith({});
    expect(prisma.asset.deleteMany).not.toHaveBeenCalled();
    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('deletes Asset rows that are attached only to PreviewProtocol', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 'orphan-key-1' },
      { key: 'orphan-key-2' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    // The findMany filter must scope to assets attached to PreviewProtocol
    // and not to any Protocol.
    expect(prisma.asset.findMany).toHaveBeenCalledWith({
      where: {
        previewProtocols: { some: {} },
        protocols: { none: {} },
      },
      select: { key: true },
    });

    // PreviewProtocol must be truncated *before* the Asset rows are deleted,
    // so the M2M join rows are removed and the Asset rows become unreferenced.
    const previewCallOrder =
      prisma.previewProtocol.deleteMany.mock.invocationCallOrder[0]!;
    const assetDeleteCallOrder =
      prisma.asset.deleteMany.mock.invocationCallOrder[0]!;
    expect(previewCallOrder).toBeLessThan(assetDeleteCallOrder);

    expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
      where: { key: { in: ['orphan-key-1', 'orphan-key-2'] } },
    });
  });

  it('deletes orphan blobs from UploadThing when provider is uploadthing', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 'ut-orphan-1' },
      { key: 'ut-orphan-2' },
    ]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 'uploadthing' },
      { key: 'uploadThingToken', value: 'sk_test_token' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(mockDeleteFiles).toHaveBeenCalledWith(['ut-orphan-1', 'ut-orphan-2']);
  });

  it('deletes orphan blobs from S3 when provider is s3', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 's3-orphan-1' },
      { key: 's3-orphan-2' },
    ]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 's3' },
      { key: 's3Endpoint', value: 'https://s3.example.com' },
      { key: 's3Region', value: 'us-east-1' },
      { key: 's3Bucket', value: 'fresco-bucket' },
      { key: 's3AccessKeyId', value: 'AKIATEST' },
      { key: 's3SecretAccessKey', value: 'secret' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(mockS3Send).toHaveBeenCalledTimes(1);

    // The DeleteObjectsCommand was constructed with both keys
    const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    expect(DeleteObjectsCommand).toHaveBeenCalledWith({
      Bucket: 'fresco-bucket',
      Delete: {
        Objects: [{ Key: 's3-orphan-1' }, { Key: 's3-orphan-2' }],
      },
    });
  });

  it('logs and continues when blob deletion fails', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([{ key: 'will-fail' }]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 'uploadthing' },
      { key: 'uploadThingToken', value: 'sk_test' },
    ]);
    mockDeleteFiles.mockRejectedValue(new Error('UploadThing is down'));

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    await expect(
      migrateProtocolsToV8(
        prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
      ),
    ).resolves.toBeUndefined();

    // The DB cleanup should still happen
    expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
      where: { key: { in: ['will-fail'] } },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Blob cleanup failed (continuing):',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
