import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';

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
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
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
const {
  mockPrismaCreate,
  mockProtocolFindUnique,
  mockGetAppSetting,
  mockSafeRevalidateTag,
  mockCaptureException,
} = vi.hoisted(() => ({
  mockPrismaCreate: vi.fn(),
  mockProtocolFindUnique: vi.fn(),
  mockGetAppSetting: vi.fn(),
  mockSafeRevalidateTag: vi.fn(),
  mockCaptureException: vi.fn(),
}));

// Mock dependencies before importing
vi.mock('~/lib/db', () => ({
  prisma: {
    interview: {
      create: mockPrismaCreate,
    },
    protocol: {
      findUnique: mockProtocolFindUnique,
    },
  },
}));

vi.mock('~/queries/appSettings', () => ({
  getAppSetting: mockGetAppSetting,
}));

vi.mock('~/lib/cache', () => ({
  safeUpdateTag: vi.fn(),
  safeRevalidateTag: mockSafeRevalidateTag,
  safeCacheTag: vi.fn(),
}));

vi.mock('~/lib/activityFeed', () => ({
  addEvent: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Run the callback inline so telemetry side effects are observable.
    after: vi.fn((callback: () => unknown) => void callback()),
  };
});

vi.mock('~/lib/posthog-server', () => ({
  captureEvent: vi.fn(),
  captureException: mockCaptureException,
  flushPostHog: vi.fn(),
}));

vi.mock('@codaco/interview/contract', () => ({
  createInitialNetwork: vi.fn(() => ({
    nodes: [],
    edges: [],
    ego: {
      [entityPrimaryKeyProperty]: 'ego-uid',
      [entityAttributesProperty]: {},
    },
  })),
}));

// Import the function under test
import { Prisma } from '~/lib/db/generated/client';

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
    mockProtocolFindUnique.mockResolvedValue({
      id: 'protocol-123',
      schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
    });
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
    // The protocol id arrives from an unauthenticated URL, so a deleted or
    // mistyped protocol is a routine outcome. Prisma signals it as P2025 on the
    // nested connect, and it must be reported as such rather than captured as
    // an application exception.
    const missingProtocolError = () =>
      new Prisma.PrismaClientKnownRequestError(
        "An operation failed because it depends on one or more records that were required but not found. No 'Protocol' record (needed to inline the relation on 'Interview' record(s)) was found for a nested connect on one-to-many relation 'InterviewToProtocol'.",
        { code: 'P2025', clientVersion: 'test' },
      );

    it('should return a no-protocol error before consulting other settings', async () => {
      mockProtocolFindUnique.mockResolvedValue(null);

      const result = await createInterview({
        protocolId: 'non-existent-protocol',
      });

      expect(result.errorType).toBe('no-protocol');
      expect(result.error).toBe('Protocol not found');
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    // A protocol that is gone is the whole answer — every other reason sends
    // the researcher after a fix that cannot help, whether that is enabling
    // anonymous recruitment or correcting an identifier on a dead link. The
    // create used to be what decided this, so any earlier return hid it.
    it('should prefer no-protocol over no-anonymous-recruitment', async () => {
      mockProtocolFindUnique.mockResolvedValue(null);
      mockGetAppSetting.mockResolvedValue(false);

      const result = await createInterview({
        protocolId: 'non-existent-protocol',
      });

      expect(result.errorType).toBe('no-protocol');
    });

    it('should prefer no-protocol over invalid-identifier', async () => {
      mockProtocolFindUnique.mockResolvedValue(null);

      const result = await createInterview({
        protocolId: 'non-existent-protocol',
        participantIdentifier: '   ',
      });

      expect(result.errorType).toBe('no-protocol');
    });

    it('refuses a protocol below the runtime schema version without creating anything', async () => {
      // A row the deploy-time migration tolerated-and-left; every recruitment
      // link attempt must be refused here, before an interview is persisted.
      mockProtocolFindUnique.mockResolvedValue({
        id: 'protocol-123',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION - 1,
      });

      const result = await createInterview({
        participantIdentifier: 'TEST-PARTICIPANT',
        protocolId: 'protocol-123',
      });

      expect(result.createdInterviewId).toBeNull();
      expect(result.errorType).toBe('incompatible-protocol');
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('should return a no-protocol error when the protocol does not exist', async () => {
      const protocolId = 'non-existent-protocol';
      const participantIdentifier = 'TEST-PARTICIPANT';

      mockPrismaCreate.mockRejectedValue(missingProtocolError());

      const result = await createInterview({
        participantIdentifier,
        protocolId,
      });

      expect(result.createdInterviewId).toBeNull();
      expect(result.errorType).toBe('no-protocol');
      expect(result.error).toBe('Protocol not found');
    });

    it('should not report a missing protocol as an exception', async () => {
      mockPrismaCreate.mockRejectedValue(missingProtocolError());

      await createInterview({
        participantIdentifier: 'TEST-PARTICIPANT',
        protocolId: 'non-existent-protocol',
      });

      expect(mockCaptureException).not.toHaveBeenCalled();
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
      expect(result.errorType).toBe('unknown');
    });

    it('should report an unexpected database failure as an exception', async () => {
      mockPrismaCreate.mockRejectedValue(new Error('Connection refused'));

      await createInterview({
        participantIdentifier: 'DB-ERROR-TEST',
        protocolId: 'protocol-db-error',
      });

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
    });

    it('should not leak the underlying error message to the caller', async () => {
      mockPrismaCreate.mockRejectedValue(
        new Error('connection to server at "10.0.0.4" failed'),
      );

      const result = await createInterview({
        participantIdentifier: 'LEAK-TEST',
        protocolId: 'protocol-leak',
      });

      expect(result.errorType).toBe('unknown');
      expect(result.error).not.toContain('10.0.0.4');
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
      // createInitialNetwork seeds the ego entity with a generated primary key
      // and empty attributes (per @codaco/interview's network contract).
      expect(createArgs[0].data.network).toEqual({
        nodes: [],
        edges: [],
        ego: {
          [entityPrimaryKeyProperty]: expect.any(String) as string,
          [entityAttributesProperty]: {},
        },
      });
    });
  });
});
