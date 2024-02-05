/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';

export const dashboardRouter = router({
  getSummaryStatistics: protectedProcedure.query(async () => {
    const interviewCount = await prisma.interview.count();
    const protocolCount = await prisma.protocol.count();
    const participantCount = await prisma.participant.count();

    return {
      interviewCount,
      protocolCount,
      participantCount,
    };
  }),
});
