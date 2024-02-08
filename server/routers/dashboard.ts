/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';
import { SearchParamsSchema } from '~/lib/data-table/types';

export const dashboardRouter = router({
  getSummaryStatistics: router({
    interviewCount: protectedProcedure.query(async () => {
      const count = await prisma.interview.count();
      return count;
    }),
    participantCount: protectedProcedure.query(async () => {
      const count = await prisma.participant.count();
      return count;
    }),
    protocolCount: protectedProcedure.query(async () => {
      const count = await prisma.protocol.count();
      return count;
    }),
  }),
  getActivities: protectedProcedure
    .input(SearchParamsSchema)
    .query(async ({ input }) => {
      const { page, perPage, sort, sortField, type, message } = input;

      console.log(input);

      // Fallback page for invalid page numbers
      const pageAsNumber = Number(page);
      const fallbackPage =
        isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;

      // Number of items to skip
      const offset = fallbackPage > 0 ? (fallbackPage - 1) * perPage : 0;

      const types = type?.split('.') ?? [];

      // Transaction is used to ensure both queries are executed in a single transaction
      const [count, tableData] = await prisma.$transaction([
        prisma.events.count({
          where: {
            ...(type ? { type: { in: types } } : {}),
            ...(message ? { message: { contains: message } } : {}),
          },
        }),
        prisma.events.findMany({
          take: perPage,
          skip: offset,
          orderBy: { [sortField]: sort },
          where: {
            ...(type ? { type: { in: types } } : {}),
            ...(message ? { message: { contains: message } } : {}),
          },
        }),
      ]);

      const pageCount = Math.ceil(count / perPage);
      return { tableData, pageCount };
    }),
});
