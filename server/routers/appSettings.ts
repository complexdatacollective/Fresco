/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { z } from 'zod';
import { signOutProc } from './session';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { utapi } from '~/app/api/uploadthing/core';

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

  getLimitInterviewsStatus: protectedProcedure.query(async () => {
    const appSettings = await prisma.appSettings.findFirst({
      select: {
        limitInterviews: true,
      },
    });

    return !!appSettings?.limitInterviews;
  }),

  create: publicProcedure.mutation(async () => {
    // Check if app settings already exist
    const existingAppSettings = await prisma.appSettings.findFirst();

    if (existingAppSettings) {
      return {
        error: 'App settings already exist',
        appSettings: existingAppSettings,
      };
    }

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

  updateLimitInterviews: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ input }) => {
      await prisma.appSettings.updateMany({
        data: {
          limitInterviews: input,
        },
      });

      revalidateTag('appSettings.get');
      revalidateTag('appSettings.getLimitInterviewsStatus');

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
      // Delete all data:
      await Promise.all([
       prisma.user.deleteMany(), // Deleting a user will cascade to Session and Key
       prisma.participant.deleteMany(),
       prisma.protocol.deleteMany(), // Deleting protocol will cascade to Interviews
       prisma.appSettings.deleteMany(),
       prisma.events.deleteMany(),
       prisma.asset.deleteMany()
      ]);

      revalidateTag('appSettings.get');
      revalidatePath('/');
      revalidateTag('appSettings.getAnonymousRecruitmentStatus');
      revalidateTag('interview.get.all');
      revalidateTag('participant.get.all');
      revalidateTag('protocol.get.all');
      revalidateTag('dashboard.getActivities');
      revalidateTag('dashboard.getSummaryStatistics.participantCount');
      revalidateTag('dashboard.getSummaryStatistics.interviewCount');
      revalidateTag('dashboard.getSummaryStatistics.protocolCount');

      // Remove all files from UploadThing:
      await utapi.listFiles({}).then((assets) => {
        const keys = assets.map((asset) => asset.key);
        return utapi.deleteFiles(keys);
      });
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
