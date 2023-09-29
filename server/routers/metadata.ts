/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { devProcedure, publicProcedure, router } from '../trpc';
import { auth } from '~/utils/auth';
import { api } from '~/app/_trpc/server';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

const getSetupMetadata = async () => {
  let setupMetadata = await prisma.setupMetadata.findFirst();
  // if no setup metadata exists, seed it
  if (!setupMetadata) {
    setupMetadata = await prisma.setupMetadata.create({
      data: {
        configured: false,
        initializedAt: new Date(),
      },
    });
  }

  return {
    ...setupMetadata,
    expired: calculateIsExpired(
      setupMetadata.configured,
      setupMetadata.initializedAt,
    ),
  };
};

const getPropertiesRouter = router({
  allSetupMetadata: publicProcedure.query(getSetupMetadata),
  expired: publicProcedure.query(async () => {
    const { expired } = await getSetupMetadata();

    return expired;
  }),
  configured: publicProcedure.query(async () => {
    const { configured } = await getSetupMetadata();

    return configured;
  }),
  initializedAt: publicProcedure.query(async () => {
    const { initializedAt } = await getSetupMetadata();

    return initializedAt;
  }),
});

export const metadataRouter = router({
  get: getPropertiesRouter,
  reset: devProcedure.mutation(async ({ ctx }) => {
    const userID = ctx.session?.user.userId;

    if (userID) {
      // eslint-disable-next-line no-console
      console.info('Active user session found during reset. Invalidating...');
      await api.session.signOut.mutate();
      await auth.invalidateAllUserSessions(userID);
    }

    // Delete the setup record:
    await prisma.setupMetadata.deleteMany();

    // Delete all data:
    await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
    await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interview and Assets

    // Todo: we need to remove assets from uploadthing before deleting the reference record.

    await api.metadata.get.allSetupMetadata.revalidate();
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

    await api.metadata.get.allSetupMetadata.revalidate();
  }),
});
