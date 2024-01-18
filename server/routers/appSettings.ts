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
import { revalidateTag } from 'next/cache';
import { clerkClient } from '@clerk/nextjs';

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
  getInstallationId: publicProcedure.query(async () => {
    const appSettings = await getAppSettings();

    if (!appSettings) {
      return null;
    }

    return appSettings.installationId;
  }),
  create: publicProcedure.mutation(async () => {
    try {
      const appSettings = await prisma.appSettings.create({
        data: {
          initializedAt: new Date(),
        },
      });

      revalidateTag('appSettings.get');
      return { error: null, appSettings };
    } catch (error) {
      return { error: 'Failed to create appSettings', appSettings: null };
    }
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

  reset: devProcedure.mutation(async ({ ctx }) => {
    const userID = ctx.auth.userId;

    if (userID) {
      const session = ctx.auth.sessionId;
      // eslint-disable-next-line no-console
      console.info('Active user session found during reset. Invalidating...');
      await clerkClient.sessions.revokeSession(session);
    }
    try {
      // Delete the setup record:
      await prisma.appSettings.deleteMany();

      // Delete all data:
      await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
      await prisma.participant.deleteMany();
      await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interviews
      await prisma.appSettings.deleteMany();

      revalidateTag('appSettings.get');

      // Todo: we need to remove assets from uploadthing before deleting the reference record.
    } catch (error) {
      return { error: 'Failed to reset appSettings', appSettings: null };
    }
  }),
  setConfigured: publicProcedure.mutation(async () => {
    try {
      await prisma.appSettings.updateMany({
        data: {
          configured: true,
        },
      });
    } catch (error) {
      return { error: 'Failed to update appSettings', appSettings: null };
    }

    revalidateTag('appSettings.get');
  }),
});
