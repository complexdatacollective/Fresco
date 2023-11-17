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
        stack: z.string().optional(),
        heading: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { stack, message, heading } }) => {
      const code = 404; // TODO: Add error code
      const appSettings = await prisma.appSettings.findFirst();

      // TODO: how to handle errors when appSettings is not available?
      if (!appSettings || !appSettings.installationId) {
        return { error: 'App settings not available' };
      }

      function extractPathFromStackTrace(
        stackTrace: string | undefined,
      ): string | undefined {
        const pathRegex = /\bapp\/(.+):\d+:\d+\)/;
        const match = stackTrace?.match(pathRegex);

        return match ? match[1] : '';
      }

      const errorPayload: ErrorPayload = {
        code: code,
        message: message,
        details: heading ? heading : '',
        stacktrace: stack ? stack : '',
        installationid: appSettings.installationId,
        path: extractPathFromStackTrace(stack) ?? '',
      };
      await trackError(errorPayload);

      return { error: null };
    }),
});
