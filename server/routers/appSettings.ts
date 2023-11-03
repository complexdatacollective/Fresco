/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import {
  devProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../trpc';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { z } from 'zod';
import { signOutProc } from './session';
import { revalidateTag } from 'next/cache';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

export const getAppSettings = async () => {
  const appSettings = await prisma.appSettings.findFirst();

  if (!appSettings) {
    return null;
  }

  return {
    ...appSettings,
    expired: calculateIsExpired(
      appSettings.configured,
      appSettings.initializedAt,
    ),
  };
};

export const appSettingsRouter = router({
  get: publicProcedure.query(getAppSettings),
  create: publicProcedure.mutation(async () => {
    const appSettings = await prisma.appSettings.create({
      data: {
        initializedAt: new Date(),
      },
    });

    revalidateTag('appSettings.get');
    return appSettings;
  }),
  updateAnonymousRecruitment: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ input }) => {
      try {
        const updatedappSettings = await prisma.appSettings.updateMany({
          data: {
            allowAnonymousRecruitment: input,
          },
        });

        revalidateTag('appSettings.get');

        return { error: null, appSettings: updatedappSettings };
      } catch (error) {
        return { error: 'Failed to update appSettings', appSettings: null };
      }
    }),
  updateAnalytics: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ input }) => {
      try {
        const updatedappSettings = await prisma.appSettings.updateMany({
          data: {
            allowAnalytics: input,
          },
        });

        revalidateTag('appSettings.get');

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
      await signOutProc({ ctx });
    }

    // Delete the setup record:
    await prisma.appSettings.deleteMany();

    // Delete all data:
    await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
    await prisma.participant.deleteMany();
    await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interviews
    await prisma.appSettings.deleteMany();

    revalidateTag('appSettings.get');

    // Todo: we need to remove assets from uploadthing before deleting the reference record.
  }),
  setConfigured: publicProcedure.mutation(async () => {
    await prisma.appSettings.updateMany({
      data: {
        configured: true,
      },
    });

    revalidateTag('appSettings.get');
  }),
});
