import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { prisma } from '~/utils/db';
import { createInterview } from './interviews';

vi.mock('~/utils/db', () => ({
  prisma: {
    interview: {
      create: vi.fn(),
    },
    appSettings: {
      findFirst: vi.fn(),
    },
  },
}));

describe('createInterview', () => {
  it('should return an error if anonymous recruitment is not allowed', async () => {
    prisma.appSettings.findFirst.mockResolvedValue({
      allowAnonymousRecruitment: false,
    });

    const result = await createInterview({
      protocolId: 'protocol-id',
      participantIdentifier: 'participant-identifier',
    });

    expect(result).toEqual({
      errorType: 'no-anonymous-recruitment',
      error: 'Anonymous recruitment is not enabled',
      createdInterviewId: null,
    });
  });

  it('should create an interview with an anonymous participant if no identifier is provided', async () => {
    prisma.appSettings.findFirst.mockResolvedValue({
      allowAnonymousRecruitment: true,
    });
    const mockCreate = prisma.interview.create.mockResolvedValue({
      id: 'interview-id',
      participant: {
        identifier: 'p-generated-id',
        label: 'Anonymous Participant',
      },
    });

    const result = await createInterview({
      protocolId: 'protocol-id',
      participantIdentifier: 'participant-identifier',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      select: {
        participant: true,
        id: true,
      },
      data: {
        network: Prisma.JsonNull,
        participant: {
          create: {
            identifier: expect.stringMatching(/^p-/),
            label: 'Anonymous Participant',
          },
        },
      },
    });

    expect(result).toEqual({
      id: 'interview-id',
      participant: {
        identifier: 'p-generated-id',
        label: 'Anonymous Participant',
      },
    });
  });

  it('should connect or create a participant if an identifier is provided', async () => {
    prisma.appSettings.findFirst.mockResolvedValue({
      allowAnonymousRecruitment: true,
    });
    const participantIdentifier = 'existing-participant';
    const mockCreate = prisma.interview.create.mockResolvedValue({
      id: 'interview-id',
      participant: {
        identifier: participantIdentifier,
      },
    });

    const result = await createInterview({
      protocolId: 'protocol-id',
      participantIdentifier,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      select: {
        participant: true,
        id: true,
      },
      data: {
        network: Prisma.JsonNull,
        participant: {
          connectOrCreate: {
            create: {
              identifier: participantIdentifier,
            },
            where: {
              identifier: participantIdentifier,
            },
          },
        },
      },
    });

    expect(result).toEqual({
      id: 'interview-id',
      participant: {
        identifier: participantIdentifier,
      },
    });
  });
});
