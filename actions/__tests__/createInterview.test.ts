import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only first to prevent import errors
vi.mock('server-only', () => ({}));

// Mock React cache and Next.js server components
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<
    Record<string, unknown> & { cache?: unknown }
  >();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  unstable_noStore: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock auth utilities to prevent auth checks in tests
vi.mock('~/utils/auth', () => ({
  requireApiAuth: vi.fn().mockResolvedValue(undefined),
  requirePageAuth: vi.fn().mockResolvedValue(undefined),
  getServerSession: vi.fn(),
}));

// Use vi.hoisted to define mocks that can be referenced before module execution
const { mockPrismaCreate, mockGetAppSetting, mockSafeRevalidateTag } =
  vi.hoisted(() => ({
    mockPrismaCreate: vi.fn(),
    mockGetAppSetting: vi.fn(),
    mockSafeRevalidateTag: vi.fn(),
  }));

// Mock dependencies before importing
vi.mock('~/lib/db', () => ({
  prisma: {
    interview: {
      create: mockPrismaCreate,
    },
  },
}));

vi.mock('~/queries/appSettings', () => ({
  getAppSetting: mockGetAppSetting,
}));

vi.mock('~/lib/cache', () => ({
  safeRevalidateTag: mockSafeRevalidateTag,
  createCachedFunction: <T extends (...args: unknown[]) => unknown>(fn: T) =>
    fn,
}));

vi.mock('~/actions/activityFeed', () => ({
  addEvent: vi.fn(),
}));

vi.mock('~/lib/analytics', () => ({
  default: vi.fn(),
}));

vi.mock('~/lib/interviewer/ducks/modules/session', () => ({
  createInitialNetwork: vi.fn(() => ({
    nodes: [],
    edges: [],
    ego: {},
  })),
}));

// Import the function under test
import { createInterview } from '../interviews';

// Type for the mock return value
type MockInterviewResult = {
  id: string;
  participant: {
    id: string;
    identifier: string;
    label: string | null;
  };
};

describe('createInterview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with participantIdentifier provided', () => {
    it('should create interview with connectOrCreate for existing participant', async () => {
      const protocolId = 'protocol-123';
      const participantIdentifier = 'PARTICIPANT-001';
      const createdInterviewId = 'interview-abc';

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'participant-id',
          identifier: participantIdentifier,
          label: null,
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      const result = await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(result.createdInterviewId).toBe(createdInterviewId);
      expect(result.error).toBeNull();
      expect(result.errorType).toBeNull();

      // Verify the Prisma call used connectOrCreate
      expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockPrismaCreate.mock.calls[0] as [
        {
          data: {
            participant: {
              connectOrCreate: {
                create: { identifier: string };
                where: { identifier: string };
              };
            };
            protocol: { connect: { id: string } };
          };
        },
      ];
      expect(
        createArgs[0].data.participant.connectOrCreate.create.identifier,
      ).toBe(participantIdentifier);
      expect(
        createArgs[0].data.participant.connectOrCreate.where.identifier,
      ).toBe(participantIdentifier);
      expect(createArgs[0].data.protocol.connect.id).toBe(protocolId);
    });

    it('should create new participant when identifier does not exist', async () => {
      const protocolId = 'protocol-456';
      const participantIdentifier = 'NEW-PARTICIPANT';
      const createdInterviewId = 'interview-def';

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'new-participant-id',
          identifier: participantIdentifier,
          label: null,
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      const result = await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(result.createdInterviewId).toBe(createdInterviewId);
      expect(result.error).toBeNull();
    });

    it('should invalidate correct cache tags on success', async () => {
      const protocolId = 'protocol-789';
      const participantIdentifier = 'CACHE-TEST';
      const createdInterviewId = 'interview-ghi';

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'participant-cache',
          identifier: participantIdentifier,
          label: null,
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(mockSafeRevalidateTag).toHaveBeenCalledWith('getInterviews');
      expect(mockSafeRevalidateTag).toHaveBeenCalledWith('getParticipants');
      expect(mockSafeRevalidateTag).toHaveBeenCalledWith('summaryStatistics');
    });
  });

  describe('without participantIdentifier (anonymous)', () => {
    it('should create anonymous participant when allowAnonymousRecruitment is enabled', async () => {
      const protocolId = 'protocol-anon-1';
      const createdInterviewId = 'interview-anon';

      mockGetAppSetting.mockResolvedValue(true);

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'anon-participant-id',
          identifier: 'p-abc123',
          label: 'Anonymous Participant',
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      const result = await createInterview({
        participantIdentifier: undefined,
        protocolId,
      });

      expect(result.createdInterviewId).toBe(createdInterviewId);
      expect(result.error).toBeNull();

      // Verify the Prisma call used create (not connectOrCreate) for anonymous
      expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockPrismaCreate.mock.calls[0] as [
        {
          data: {
            participant: {
              create: { identifier: string; label: string };
            };
          };
        },
      ];
      expect(createArgs[0].data.participant.create.label).toBe(
        'Anonymous Participant',
      );
      // Verify the anonymous identifier starts with 'p-'
      expect(createArgs[0].data.participant.create.identifier).toMatch(/^p-/);
    });

    it('should return error when allowAnonymousRecruitment is disabled', async () => {
      const protocolId = 'protocol-no-anon';

      mockGetAppSetting.mockResolvedValue(false);

      const result = await createInterview({
        participantIdentifier: undefined,
        protocolId,
      });

      expect(result.createdInterviewId).toBeNull();
      expect(result.error).toBe('Anonymous recruitment is not enabled');
      expect(result.errorType).toBe('no-anonymous-recruitment');

      // Should not have called Prisma create
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('should not check allowAnonymousRecruitment when identifier is provided', async () => {
      const protocolId = 'protocol-with-id';
      const participantIdentifier = 'HAS-IDENTIFIER';
      const createdInterviewId = 'interview-with-id';

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'participant-with-id',
          identifier: participantIdentifier,
          label: null,
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      await createInterview({
        participantIdentifier,
        protocolId,
      });

      // Should not have checked the setting
      expect(mockGetAppSetting).not.toHaveBeenCalledWith(
        'allowAnonymousRecruitment',
      );
    });
  });

  describe('error handling', () => {
    it('should return error when protocol does not exist', async () => {
      const protocolId = 'non-existent-protocol';
      const participantIdentifier = 'TEST-PARTICIPANT';

      mockPrismaCreate.mockRejectedValue(
        new Error('Record to connect not found'),
      );

      const result = await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(result.createdInterviewId).toBeNull();
      expect(result.error).toBe('Failed to create interview');
      expect(result.errorType).toBe('Record to connect not found');
    });

    it('should return error on database failure', async () => {
      const protocolId = 'protocol-db-error';
      const participantIdentifier = 'DB-ERROR-TEST';

      mockPrismaCreate.mockRejectedValue(new Error('Connection refused'));

      const result = await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(result.createdInterviewId).toBeNull();
      expect(result.error).toBe('Failed to create interview');
      expect(result.errorType).toBe('Connection refused');
    });

    it('should not invalidate cache on error', async () => {
      const protocolId = 'protocol-no-cache';
      const participantIdentifier = 'NO-CACHE-TEST';

      mockPrismaCreate.mockRejectedValue(new Error('Database error'));

      await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(mockSafeRevalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('network initialization', () => {
    it('should create interview with initial network', async () => {
      const protocolId = 'protocol-network';
      const participantIdentifier = 'NETWORK-TEST';
      const createdInterviewId = 'interview-network';

      const mockResult: MockInterviewResult = {
        id: createdInterviewId,
        participant: {
          id: 'participant-network',
          identifier: participantIdentifier,
          label: null,
        },
      };
      mockPrismaCreate.mockResolvedValue(mockResult);

      await createInterview({
        participantIdentifier,
        protocolId,
      });

      // Verify network was passed to create
      expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockPrismaCreate.mock.calls[0] as [
        {
          data: {
            network: { nodes: unknown[]; edges: unknown[]; ego: object };
          };
        },
      ];
      expect(createArgs[0].data.network).toEqual({
        nodes: [],
        edges: [],
        ego: {},
      });
    });
  });
});
