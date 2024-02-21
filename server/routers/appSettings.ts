/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { z } from 'zod';
import { signOutProc } from './session';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cache } from 'react';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

export const getAppSettings = cache(async () => {
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
});

export const appSettingsRouter = router({
  get: publicProcedure.query(getAppSettings),
  getInstallationId: publicProcedure.query(async () => {
    const appSettings = await getAppSettings();

    if (!appSettings) {
      return null;
    }

    return appSettings.installationId;
  }),
  getAnonymousRecruitmentStatus: protectedProcedure.query(async () => {
    const appSettings = await prisma.appSettings.findFirst({
      select: {
        allowAnonymousRecruitment: true,
      },
    });

    return !!appSettings?.allowAnonymousRecruitment;
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
      await prisma.appSettings.updateMany({
        data: {
          allowAnonymousRecruitment: input,
        },
      });

      revalidateTag('appSettings.get');
      revalidateTag('appSettings.getAnonymousRecruitmentStatus');

      return input;
    }),

  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const userID = ctx.session?.user.userId;

    if (userID) {
      // eslint-disable-next-line no-console
      console.info('Active user session found during reset. Invalidating...');
      await signOutProc({ ctx });
    }
    try {
      // Delete the setup record:
      await prisma.appSettings.deleteMany();

      // Delete all data:
      await prisma.user.deleteMany(); // Deleting a user will cascade to Session and Key
      await prisma.participant.deleteMany();
      await prisma.protocol.deleteMany(); // Deleting protocol will cascade to Interviews
      await prisma.appSettings.deleteMany();
      await prisma.events.deleteMany();

      revalidateTag('appSettings.get');
      revalidatePath('/');
      revalidateTag('appSettings.getAnonymousRecruitmentStatus');
      revalidateTag('interview.get.all');
      revalidateTag('participant.get.all');
      revalidateTag('dashboard.getActivities');

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
