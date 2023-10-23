/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import {
  devProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../trpc';
import { auth } from '~/utils/auth';
import { trpc } from '~/trpc/server';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { z } from 'zod';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

const getappSettings = async () => {
  let appSettings = await prisma.appSettings.findFirst();
  // if no setup appSettings exists, seed it
  if (!appSettings) {
    appSettings = await prisma.appSettings.create({
      data: {
        configured: false,
        initializedAt: new Date(),
      },
    });
  }

  return {
    ...appSettings,
    expired: calculateIsExpired(
      appSettings.configured,
      appSettings.initializedAt,
    ),
  };
};

const getPropertiesRouter = router({
  allappSettings: publicProcedure.query(getappSettings),
  expired: publicProcedure.query(async () => {
    const { expired } = await getappSettings();

    return expired;
  }),
  configured: publicProcedure.query(async () => {
    const { configured } = await getappSettings();

    return configured;
  }),
  initializedAt: publicProcedure.query(async () => {
    const { initializedAt } = await getappSettings();

    return initializedAt;
  }),
  allowAnonymousRecruitment: publicProcedure.query(async () => {
    const { allowAnonymousRecruitment } = await getappSettings();

    return allowAnonymousRecruitment;
  }),
});

export const appSettingsRouter = router({
  get: getPropertiesRouter,
  updateAnonymousRecruitment: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ input }) => {
      const { configured, initializedAt } = await getappSettings();
      try {
        const updatedappSettings = await prisma.appSettings.update({
          where: {
            configured_initializedAt: {
              configured,
              initializedAt,
            },
          },
          data: {
            allowAnonymousRecruitment: input,
          },
        });
        return { error: null, appSettings: updatedappSettings };
      } catch (error) {
        return { error: 'Failed to update appSettings', appSettings: null };
      }
    }),

  reset: devProcedure.mutation(async ({ ctx }) => {
    const userID = ctx.session?.user.userId;

    if (userID) {
      // eslint-disable-next-line no-console
      console.info('Active user session found during reset. Invalidating...');
      await trpc.session.signOut.mutate();
      await auth.invalidateAllUserSessions(userID);
    }

    // Delete the setup record:
    await prisma.appSettings.deleteMany();

    // Delete all data:
    await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
    await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interview and Assets

    // Todo: we need to remove assets from uploadthing before deleting the reference record.

    await trpc.appSettings.get.allappSettings.revalidate();
  }),
  setConfigured: publicProcedure.mutation(async () => {
    const { configured, initializedAt } = await getappSettings();

    await prisma.appSettings.update({
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

    await trpc.appSettings.get.allappSettings.revalidate();
  }),
});
