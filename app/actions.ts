'use server';

import { prisma } from '~/utils/db';

export async function setConfigured() {
  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.setupMetadata.update({
    where: { id: 1 },
    data: {
      configured: true,
      configuredAt: new Date(),
    },
  });
}

export async function setOnboarded() {
  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.setupMetadata.update({
    where: { id: 1 },
    data: {
      onboarded: true,
    },
  });
}

export async function checkUserExists() {
  // eslint-disable-next-line local-rules/require-data-mapper
  const userCount = await prisma.user.count();
  return userCount > 0;
}
