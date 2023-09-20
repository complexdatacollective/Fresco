/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { getSetupMetadata } from '~/utils/getSetupMetadata';

export const metadataRouter = router({
  get: publicProcedure.query(async () => {
    return getSetupMetadata();
  }),
  reset: protectedProcedure.mutation(async () => {
    await prisma.setupMetadata.deleteMany();
    await prisma.user.deleteMany();
  }),
  setConfigured: publicProcedure.mutation(async () => {
    const { configured, initializedAt } = await getSetupMetadata();

    await prisma.setupMetadata.update({
      where: {
        configured_initializedAt: {
          configured,
          initializedAt,
        },
      },
      data: {
        configured: true,
        configuredAt: new Date(),
      },
    });
  }),
});
