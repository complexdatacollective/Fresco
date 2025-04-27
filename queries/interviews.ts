import 'server-only';
import superjson from 'superjson';
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

    return interviews;
  },
  ['getInterviewsForExport', 'getInterviews'],
);

export type GetInterviewsForExportReturnType = ReturnType<
  typeof getInterviewsForExport
>;

/**
 * Because we use a client extension to parse the JSON fields, we can't use the
 * automatically generated types from the Prisma client (Prisma.InterviewGetPayload).
 *
 * Instead, we have to infer the type from the return value.
 */
async function prisma_getInterviewById(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      protocol: {
        include: { assets: true },
        omit: {
          // importedAt: true,
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

export const getInterviewById = (interviewId: string) =>
  createCachedFunction(
    async (interviewId: string) => {
      const interview = await prisma_getInterviewById(interviewId);
      console.log('interview', interview);

      if (!interview) {
        return null;
      }

      // We need to superjsonify the result, because we pass it to the client
      // and it contains a Date object. We should look into if this could be
      // implemented in the Prisma client instead, or the createCachedFunction
      // helper (could be generalised to `createServerFunction`).
      const safeInterview = superjson.stringify(interview);

      return safeInterview;
    },
    [`getInterviewById-${interviewId}`, 'getInterviewById'],
  )(interviewId);
