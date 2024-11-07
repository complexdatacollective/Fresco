import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import testProtocol from '~/lib/protocol.json' with { type: 'json' };
import { prisma } from '~/utils/db';

export const getInterviews = createCachedFunction(async () => {
  const interviews = await prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
  return interviews;
}, ['getInterviews']);

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;

export const getInterviewsForExport = createCachedFunction(
  async (interviewIds: string[]) => {
    const interviews = await prisma.interview.findMany({
      where: {
        id: {
          in: interviewIds,
        },
      },
      include: {
        protocol: true,
        participant: true,
      },
    });
    return interviews;
  },
  ['getInterviewsForExport', 'getInterviews'],
);

export const getInterviewById = (interviewId: string) =>
  createCachedFunction(
    async (interviewId: string) => {
      const interview = await prisma.interview.findUnique({
        where: {
          id: interviewId,
        },
        include: {
          protocol: {
            include: {
              assets: true,
            },
          },
        },
      });

      return interview;
    },
    [`getInterviewById-${interviewId}`, 'getInterviewById'],
  )(interviewId);

export const TESTING_getInterviewById = async (interviewId: string) => {
  const interview = await prisma.interview.findUnique({
    where: {
      id: interviewId,
    },
    include: {
      protocol: {
        include: {
          assets: true,
        },
      },
    },
  });

  if (!interview) {
    return null;
  }

  // Override protocol with a test protocol
  interview.protocol.stages = testProtocol.stages;
  interview.protocol.codebook = testProtocol.codebook;

  return interview;
};
