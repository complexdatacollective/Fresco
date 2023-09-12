'use server';

import { prisma } from '~/utils/db';

export async function updateSetupMetadata() {
  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.setupMetadata.update({
    where: { id: 1 },
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

export async function checkSessionExists() {
  // eslint-disable-next-line local-rules/require-data-mapper
  const sessionCount = await prisma.session.count();
  return sessionCount > 0;
}
