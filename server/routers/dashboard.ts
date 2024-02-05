/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, router } from '../trpc';
import {
  type Activity,
  ActivitySchema,
} from '~/app/(dashboard)/dashboard/_components/ActivityFeed/utils';
import { searchParamsSchema } from '~/lib/data-table/types';

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
  activities: router({
    add: protectedProcedure
      .input(ActivitySchema)
      .mutation(async ({ input }) => {
        const activity = await prisma.events.create({
          data: input,
        });

        return activity;
      }),
  }),
});
