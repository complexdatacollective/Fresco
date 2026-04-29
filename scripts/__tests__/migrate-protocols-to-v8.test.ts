import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateProtocolsToV8 } from '~/scripts/migrate-protocols-to-v8';

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
    // so the M2M join rows cascade and the Asset rows become unreferenced.
    const previewCallOrder =
      prisma.previewProtocol.deleteMany.mock.invocationCallOrder[0];
    const assetDeleteCallOrder =
      prisma.asset.deleteMany.mock.invocationCallOrder[0];
    expect(previewCallOrder).toBeLessThan(assetDeleteCallOrder!);

    expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
      where: { key: { in: ['orphan-key-1', 'orphan-key-2'] } },
    });
  });
});
