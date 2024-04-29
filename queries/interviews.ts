import { prisma } from '~/utils/db';
import 'server-only';
import { unstable_cache } from 'next/cache';

export const getInterviews = unstable_cache(
  async () => {
    const interviews = await prisma.interview.findMany({
      include: {
        protocol: true,
        participant: true,
      },
    });
    return interviews;
  },
  ['getInterviews'],
  {
    tags: ['getInterviews'],
  },
);

export type GetInterviewsType = typeof getInterviews;
export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;

export const getInterviewsForExport = unstable_cache(
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
  ['getInterviewsForExport'],
  {
    tags: ['getInterviewsForExport', 'getInterviews'],
  },
);

export type GetInterviewsForExportType = typeof getInterviewsForExport;
export type GetInterviewsForExportReturnType = ReturnType<
  typeof getInterviewsForExport
>;

export const getInterviewById = unstable_cache(
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
  ['getInterviewById'],
  {
    tags: ['getInterviewById', 'getInterviews'],
  },
);
