/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';
import { SearchParamsSchema } from '~/lib/data-table/types';

export const dashboardRouter = router({
  getSummaryStatistics: protectedProcedure.query(async () => {
    const counts = await prisma.$transaction([
      prisma.interview.count(),
      prisma.protocol.count(),
      prisma.participant.count(),
    ]);

    return {
      interviewCount: counts[0],
      protocolCount: counts[1],
      participantCount: counts[2],
    };
  }),
  getActivities: protectedProcedure
    .input(SearchParamsSchema)
    .query(async ({ input }) => {
      const { page, perPage, sort, sortField, filterParams } = input;

      // Number of items to skip
      const offset = page > 0 ? (page - 1) * perPage : 0;

      // Generate the dynamic filter parameters for the database call from the
      // input filter params.
      const queryFilterParams = filterParams
        ? {
            OR: [
              ...filterParams.map(({ id, value }) => {
                const operator = Array.isArray(value) ? 'in' : 'contains';
                return {
                  [id]: { [operator]: value },
                };
              }),
            ],
          }
        : {};

      // Transaction is used to ensure both queries are executed in a single transaction
      const [count, events] = await prisma.$transaction([
        prisma.events.count({
          where: {
            ...queryFilterParams,
          },
        }),
        prisma.events.findMany({
          take: perPage,
          skip: offset,
          orderBy: { [sortField]: sort },
          where: {
            ...queryFilterParams,
          },
        }),
      ]);

      const pageCount = Math.ceil(count / perPage);
      return { events, pageCount };
    }),
});
