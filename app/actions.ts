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
