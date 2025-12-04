import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma
const mockPrisma = {
  protocol: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  asset: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  participant: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// Mock uploadthing API
const mockDeleteFiles = vi.fn();
const mockGetUTApi = vi.fn();

// Mock the db module
vi.mock('~/utils/db', () => ({
  prisma: mockPrisma,
}));

// Mock uploadthing-server-helpers
vi.mock('~/lib/uploadthing-server-helpers', () => ({
  getUTApi: () => mockGetUTApi() as Promise<{ deleteFiles: typeof mockDeleteFiles }>,
}));

describe('prunePreviewProtocols', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUTApi.mockResolvedValue({
      deleteFiles: mockDeleteFiles,
    });
  });

  it('should delete protocols older than 24 hours', async () => {
    // Dynamic import to ensure mocks are set up
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    const oldProtocol = {
      id: 'old-protocol',
      hash: 'hash-123',
      name: 'Old Protocol',
    };

    mockPrisma.protocol.findMany.mockResolvedValue([oldProtocol]);
    mockPrisma.asset.findMany.mockResolvedValue([]);
    mockPrisma.participant.findMany.mockResolvedValue([]);
    mockPrisma.protocol.deleteMany.mockResolvedValue({ count: 1 });

    const result = await prunePreviewProtocols();

    expect(result.deletedCount).toBe(1);
    expect(result.error).toBeUndefined();
    expect(mockPrisma.protocol.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['old-protocol'],
        },
      },
    });
  });

  it('should not delete protocols newer than 24 hours', async () => {
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    mockPrisma.protocol.findMany.mockResolvedValue([]);

    const result = await prunePreviewProtocols();

    expect(result.deletedCount).toBe(0);
    expect(mockPrisma.protocol.deleteMany).not.toHaveBeenCalled();
  });

  it('should delete associated assets from UploadThing', async () => {
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    const oldProtocol = {
      id: 'old-protocol',
      hash: 'hash-123',
      name: 'Old Protocol',
    };

    const assets = [
      { key: 'ut-key-1' },
      { key: 'ut-key-2' },
    ];

    mockDeleteFiles.mockResolvedValue({ success: true });
    mockPrisma.protocol.findMany.mockResolvedValue([oldProtocol]);
    mockPrisma.asset.findMany.mockResolvedValue(assets);
    mockPrisma.participant.findMany.mockResolvedValue([]);
    mockPrisma.asset.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.protocol.deleteMany.mockResolvedValue({ count: 1 });

    const result = await prunePreviewProtocols();

    expect(result.deletedCount).toBe(1);
    expect(mockDeleteFiles).toHaveBeenCalledWith(['ut-key-1', 'ut-key-2']);
  });

  it('should delete orphaned participants', async () => {
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    const oldProtocol = {
      id: 'old-protocol',
      hash: 'hash-123',
      name: 'Old Protocol',
    };

    const participants = [
      { id: 'participant-1' },
      { id: 'participant-2' },
    ];

    mockPrisma.protocol.findMany.mockResolvedValue([oldProtocol]);
    mockPrisma.asset.findMany.mockResolvedValue([]);
    mockPrisma.participant.findMany.mockResolvedValue(participants);
    mockPrisma.protocol.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.participant.deleteMany.mockResolvedValue({ count: 2 });

    const result = await prunePreviewProtocols();

    expect(result.deletedCount).toBe(1);
    expect(mockPrisma.participant.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['participant-1', 'participant-2'],
        },
      },
    });
  });

  it('should handle errors gracefully', async () => {
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    mockPrisma.protocol.findMany.mockRejectedValue(
      new Error('Database error'),
    );

    const result = await prunePreviewProtocols();

    expect(result.deletedCount).toBe(0);
    expect(result.error).toBe('Database error');
  });

  it('should only query for preview protocols with pending/completed cutoffs', async () => {
    const { prunePreviewProtocols } = await import(
      '../preview-protocol-pruning'
    );

    mockPrisma.protocol.findMany.mockResolvedValue([]);

    await prunePreviewProtocols();

    // Verify that findMany was called with the correct query structure
    expect(mockPrisma.protocol.findMany).toHaveBeenCalled();

    const mockCalls = mockPrisma.protocol.findMany.mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);

    // Check that the query includes isPreview: true and OR conditions for pending/completed
    const firstCall = mockCalls[0];
    expect(firstCall).toBeDefined();
    if (firstCall) {
      type QueryArgs = {
        where?: {
          isPreview?: boolean;
          OR?: Array<{ isPending?: boolean; importedAt?: { lt?: Date } }>;
        };
      };
      const args = firstCall[0] as QueryArgs;
      expect(args.where?.isPreview).toBe(true);
      expect(args.where?.OR).toHaveLength(2);
      // Pending protocols cutoff (15 min)
      expect(args.where?.OR?.[0]?.isPending).toBe(true);
      expect(args.where?.OR?.[0]?.importedAt?.lt).toBeInstanceOf(Date);
      // Completed protocols cutoff (24 hours)
      expect(args.where?.OR?.[1]?.isPending).toBe(false);
      expect(args.where?.OR?.[1]?.importedAt?.lt).toBeInstanceOf(Date);
    }
  });
});
