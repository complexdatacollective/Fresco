'use server';

import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function getInterviews() {
  await requireApiAuth();

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
  await requireApiAuth();

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
