import type { Codebook, Stage } from '@codaco/protocol-validation';
import 'server-only';
import { createCachedFunction } from '~/lib/cache';
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

    const processedInterviews = interviews.map((interview) => ({
      ...interview,
      protocol: {
        ...interview.protocol,
        codebook: interview.protocol.codebook as Codebook,
        stages: interview.protocol.stages as Stage[],
      },
    }));

    return processedInterviews;
  },
  ['getInterviewsForExport', 'getInterviews'],
);

export type GetInterviewsForExportReturnType = ReturnType<
  typeof getInterviewsForExport
>;

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
          codebook: interview.protocol.codebook as Codebook,
          stages: interview.protocol.stages as Stage[],
        },
      };
    },
    [`getInterviewById-${interviewId}`, 'getInterviewById'],
  )(interviewId);

export type GetInterviewByIdReturnType = Awaited<
  ReturnType<typeof getInterviewById>
>;
