import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { getSetupMetadata } from '~/utils/getSetupMetadata';

export const metadataRouter = router({
  get: publicProcedure.query(async () => {
    const setupMetadata = await getSetupMetadata();

    return setupMetadata;
  }),
  reset: protectedProcedure.mutation(async () => {
    // eslint-disable-next-line local-rules/require-data-mapper
    await prisma.setupMetadata.deleteMany();
    // eslint-disable-next-line local-rules/require-data-mapper
    await prisma.user.deleteMany();
  }),
});
