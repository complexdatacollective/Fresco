import { redirect } from 'next/navigation';
import React, { Suspense, cache } from 'react';
import { prisma } from '~/utils/db';
import Setup from './Setup';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

const getAppSettings = cache(async () => {
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

export default async function Page() {
  const appSettings = await getAppSettings();

  const expired = appSettings?.expired ?? false;

  if (expired) {
    redirect('/expired');
  }

  return (
    <Suspense>
      <Setup />
    </Suspense>
  );
}
