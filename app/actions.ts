'use server';

import { prisma } from '~/utils/db';
import getSetupMetadata from '~/utils/getSetupMetadata';

export async function setConfigured() {
  const setupMetadata = await getSetupMetadata();
  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.setupMetadata.update({
    where: { id: setupMetadata.id },
    data: {
      configured: true,
      configuredAt: new Date(),
    },
  });
}

export async function checkUserExists() {
  // eslint-disable-next-line local-rules/require-data-mapper
  const userCount = await prisma.user.count();
  return userCount > 0;
}

export async function checkConfigExpired() {
  const setupMetadata = await getSetupMetadata();

  const configExpired: boolean =
    Date.now() - setupMetadata.initializedAt.getTime() > 300000;

  return configExpired;
}
