import { describe, expect, it, vi } from 'vitest';
import prisma from '~/utils/__mocks__/db';
import { createInterview } from './interviews';

// mock prisma client
vi.mock('~/utils/db', () => ({ prisma }));

// mock server-only module
vi.mock('server-only', () => ({}));

// Mock the '~/lib/analytics's module
vi.mock('@codaco/analytics', () => {
  return {
    makeEventTracker: vi.fn(() => {
      return vi.fn(); // Mock implementation of `trackEvent`
    }),
  };
});

// Mock the cache.ts module
vi.mock('~/lib/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/cache')>();
  return {
    ...actual,
    safeRevalidateTag: vi.fn(),
  };
});

// vi.mock('~/lib/analytics', async (importOriginal) => {
//   const actual = await importOriginal<typeof import('~/lib/analytics')>();
//   return {
//     ...actual,
//     default: vi.fn(),
//   };
// });

// Mock the '~/utils/auth' module
vi.mock('react', async (importOriginal) => {
  const testCache = <T extends (...args: Array<unknown>) => unknown>(func: T) =>
    func;
  const originalModule = await importOriginal<typeof import('react')>();
  return {
    ...originalModule,
    cache: testCache,
  };
});

describe('createInterview', () => {
  it('should return an error if anonymous recruitment is not enabled and participantIdentifier is not provided ', async () => {
    prisma.appSettings.findFirst.mockResolvedValue({
      configured: false,
      initializedAt: new Date(),
      allowAnonymousRecruitment: false,
      limitInterviews: false,
      installationId: 'installation-id',
    });

    const result = await createInterview({
      protocolId: 'protocol-id',
      participantIdentifier: undefined,
    });

    expect(result).toEqual({
      errorType: 'no-anonymous-recruitment',
      error: 'Anonymous recruitment is not enabled',
      createdInterviewId: null,
    });
  });

  it('should create an interview with an anonymous participant if no identifier is provided', async () => {
    prisma.appSettings.findFirst.mockResolvedValue({
      configured: false,
      initializedAt: new Date(),
      allowAnonymousRecruitment: true,
      limitInterviews: false,
      installationId: 'installation-id',
    });

    prisma.interview.create.mockResolvedValue({
      id: 'interview-id',
      participant: {
        id: 'participant-id',
        identifier: 'p-generated-id',
        label: 'Anonymous Participant',
      },
    });

    const result = await createInterview({
      protocolId: 'protocol-id',
      participantIdentifier: undefined,
    });

    expect(result).toEqual({
      error: null,
      createdInterviewId: 'interview-id',
      errorType: null,
    });
  });

  // it('should connect a participant if an existing identifier is provided', async () => {
  //   prisma.appSettings.findFirst.mockResolvedValue({
  //     configured: false,
  //     initializedAt: new Date(),
  //     allowAnonymousRecruitment: true,
  //     limitInterviews: false,
  //     installationId: 'installation-id',
  //   });
  //   const participantIdentifier = 'existing-participant';
  //   const mockCreate = vi.spyOn(prisma.interview, 'create');

  //   prisma.interview.create.mockResolvedValue({
  //     id: 'interview-id',
  //     participant: {
  //       id: 'participant-id',
  //       identifier: participantIdentifier,
  //       label: 'Existing Participant',
  //     },
  //   });

  //   const result = await createInterview({
  //     protocolId: 'protocol-id',
  //     participantIdentifier,
  //   });

  //   expect(mockCreate).toHaveBeenCalledWith({
  //     select: {
  //       participant: true,
  //       id: true,
  //     },
  //     data: {
  //       network: Prisma.JsonNull,
  //       participant: {
  //         connect: {
  //           identifier: participantIdentifier,
  //         },
  //       },
  //       protocol: {
  //         connect: {
  //           id: 'protocol-id',
  //         },
  //       },
  //     },
  //   });

  //   expect(result).toEqual({
  //     error: null,
  //     createdInterviewId: 'interview-id',
  //     errorType: null,
  //   });
  // });
});
