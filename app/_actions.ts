'use server';

import { prisma } from '~/utils/db';
import { getSetupMetadata } from '~/utils/getSetupMetadata';

export async function setConfigured() {
  console.log('Setting app as configured...');
  const { configured, initializedAt } = await getSetupMetadata();

  // eslint-disable-next-line local-rules/require-data-mapper
  const result = await prisma.setupMetadata.update({
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

  console.log('App configured:', result);
}

export async function resetConfigured() {
  await prisma.setupMetadata.deleteMany();
  await prisma.user.deleteMany();
}
