/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';
import { searchParamsSchema } from '~/lib/data-table/types';
import { type Events } from '@prisma/client';

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
    .input(searchParamsSchema)
    .query(async ({ input }) => {
      const { page, per_page, sort, type, message } = input;

      // Fallback page for invalid page numbers
      const pageAsNumber = Number(page);
      const fallbackPage =
        isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;

      // Number of items per page
      const perPageAsNumber = Number(per_page);
      const limit = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

      // Number of items to skip
      const offset = fallbackPage > 0 ? (fallbackPage - 1) * limit : 0;

      // Column and order to sort by
      // Spliting the sort string by "." to get the column and order
      // Example: "title.desc" => ["title", "desc"]
      const [column, order] = (sort?.split('.') as [
        keyof Events | undefined,
        'asc' | 'desc' | undefined,
      ]) ?? ['timestamp', 'desc'];

      const types = type?.split('.') ?? [];

      // Transaction is used to ensure both queries are executed in a single transaction
      const [count, data] = await prisma.$transaction([
        prisma.events.count({
          where: {
            ...(type ? { type: { in: types } } : {}),
            ...(message ? { message: { contains: message } } : {}),
          },
        }),
        prisma.events.findMany({
          take: limit,
          skip: offset,
          orderBy: { [column!]: order },
          where: {
            ...(type ? { type: { in: types } } : {}),
            ...(message ? { message: { contains: message } } : {}),
          },
        }),
      ]);

      const pageCount = Math.ceil(count / limit);
      return { data, pageCount };
    }),
});
