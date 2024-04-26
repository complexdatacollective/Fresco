import { prisma } from '~/utils/db';
import 'server-only';
import { unstable_noStore } from 'next/cache';

export async function getInterviews() {
  const interviews = await prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
  return interviews;
}

export type GetInterviewsType = typeof getInterviews;
export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;

export async function getInterviewsForExport(interviewIds: string[]) {
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
}

export type GetInterviewsForExportType = typeof getInterviewsForExport;
export type GetInterviewsForExportReturnType = ReturnType<
  typeof getInterviewsForExport
>;

export async function getInterviewById(interviewId: string) {
  unstable_noStore();

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
}
