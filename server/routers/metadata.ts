/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { getSetupMetadata } from '~/utils/getSetupMetadata';
import { auth } from '~/utils/auth';

export const metadataRouter = router({
  get: publicProcedure.query(async () => {
    return getSetupMetadata();
  }),
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const userID = ctx.session?.user.userId;
    // If anyone is signed in, sign them out:
    await auth.invalidateAllUserSessions(userID);

    // Delete the setup record:
    await prisma.setupMetadata.deleteMany();

    // Delete all data:
    await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
    await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interview and Assets

    // Todo: we need to remove assets from uploadthing before deleting the reference record.
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
