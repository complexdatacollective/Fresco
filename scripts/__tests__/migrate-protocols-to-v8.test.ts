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
});
