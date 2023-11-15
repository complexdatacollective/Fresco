'use server';

import { type ErrorPayload, trackError } from '@codaco/analytics';
import { api } from '~/trpc/server';

export async function sendError({
  error,
  heading,
}: {
  error: Error;
  heading?: string;
}) {
  const code = 123;
  const stacktrace = 'stacktrace';
  const appSettings = await api.appSettings.get.query();

  if (!appSettings || !appSettings.installationId) {
    return;
  }

  const errorPayload: ErrorPayload = {
    code: code,
    message: error.message,
    details: heading ? heading : '',
    stacktrace: stacktrace,
    installationid: appSettings.installationId,
    path: '/interview',
  };
  await trackError(errorPayload);
}
