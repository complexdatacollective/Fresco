/* eslint-disable local-rules/require-data-mapper */

import { type ErrorPayload, trackError } from '@codaco/analytics';
import { publicProcedure, router } from '../trpc';
import { prisma } from '~/utils/db';
import { z } from 'zod';

export const errorsRouter = router({
  send: publicProcedure
    .input(
      z.object({
        message: z.string(),
        stack: z.string(),
        heading: z.string(),
      }),
    )
    .mutation(async ({ input: { stack, message, heading } }) => {
      console.log('sending error');
      const code = 123; // TODO: Add error code
      const appSettings = await prisma.appSettings.findFirst();

      // TODO: how to handle errors when appSettings is not available?
      if (!appSettings || !appSettings.installationId) {
        return { error: 'App settings not available' };
      }

      const errorPayload: ErrorPayload = {
        code: code,
        message: message,
        details: heading ? heading : '',
        stacktrace: stack ? stack : '',
        installationid: appSettings.installationId,
        path: '/',
      };
      console.log('errorPayload', errorPayload);
      await trackError(errorPayload);

      return { error: null }; // Indicate success
    }),
});
