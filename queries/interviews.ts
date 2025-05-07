import 'server-only';
import superjson from 'superjson';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

/**
 * Define the Prisma query logic for fetching all interviews separately
 * to infer the type from the return value.
 */
async function prisma_getInterviews() {
  return prisma.interview.findMany({
    include: {
      protocol: true,
      participant: true,
    },
  });
}
export type GetInterviewsQuery = Awaited<
  ReturnType<typeof prisma_getInterviews>
>;

export const getInterviews = createCachedFunction(async () => {
  const interviews = await prisma_getInterviews();
  const safeInterviews = superjson.stringify(interviews);
  return safeInterviews;
}, ['getInterviews']);

export type GetInterviewsReturnType = ReturnType<typeof getInterviews>;
async function prisma_getInterviewsForExport(interviewIds: string[]) {
  return prisma.interview.findMany({
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
}
export type GetInterviewsForExportQuery = Awaited<
  ReturnType<typeof prisma_getInterviewsForExport>
>;

export const getInterviewsForExport = async (interviewIds: string[]) => {
  const interviews = await prisma_getInterviewsForExport(interviewIds);
  const safeInterviews = superjson.stringify(interviews);
  return safeInterviews;
};
export type GetInterviewsForExportReturnType = ReturnType<
  typeof getInterviewsForExport
>;

/**
 * Because we use a client extension to parse the JSON fields, we can't use the
 * automatically generated types from the Prisma client (Prisma.InterviewGetPayload).
 *
 * Instead, we have to infer the type from the return value. To do this, we
 * have to define the function outside of getInterviewById.
 */
async function prisma_getInterviewById(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      protocol: {
        include: { assets: true },
        omit: {
          lastModified: true,
          hash: true,
        },
      },
    },
  });
}
export type GetInterviewByIdQuery = Awaited<
  ReturnType<typeof prisma_getInterviewById>
>;

// Note that this function should not be cached, because invalidating the cache
// would cause the interview route to reload, thereby clearing the redux store.
export const getInterviewById = async (interviewId: string) => {
  const interview = await prisma_getInterviewById(interviewId);

  if (!interview) {
    return null;
  }

  // We need to superjsonify the result, because we pass it to the client
  // and it contains a Date object. We should look into if this could be
  // implemented in the Prisma client instead, or the createCachedFunction
  // helper (could be generalised to `createServerFunction`).
  const safeInterview = superjson.stringify(interview);

  return safeInterview;
};
