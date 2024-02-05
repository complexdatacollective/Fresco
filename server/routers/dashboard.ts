/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';

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
});
