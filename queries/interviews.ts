import 'server-only';
import { createCachedFunction } from '~/lib/cache';
import { protocol } from '~/lib/test-protocol';
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
        protocol: {
          include: {
            assets: true,
          },
        },
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

      if (!interview) {
        return null;
      }

      return {
        ...interview,
        protocol: {
          ...interview.protocol,
          stages: protocol.stages,
          codebook: protocol.codebook,
        },
        stageMetadata:
          interview.stageMetadata ?? ({} as Record<string, unknown>),
      };
    },
    [`getInterviewById-${interviewId}`, 'getInterviewById'],
  )(interviewId);

export const TESTING_getInterviewById = async (interviewId: string) => {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ TESTING_getInterviewById is being used! Remove before release. ⚠️',
  );
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
  interview.protocol.stages = protocol.stages;
  interview.protocol.codebook = protocol.codebook;

  return interview;
};
