/* eslint-disable local-rules/require-data-mapper */
import type { SetupMetadata } from '@prisma/client';
import { cache } from 'react';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { prisma } from '~/utils/db';

type SetupMetadataWithExpired = SetupMetadata & {
  expired: boolean;
};

export async function resetSetupMetadata() {
  await prisma.setupMetadata.deleteMany();
  await prisma.user.deleteMany();
}

export async function getSetupMetadata(): Promise<SetupMetadataWithExpired> {
  let setupMetadata = await prisma.setupMetadata.findFirst();

  // if no setup metadata exists, seed it
  if (!setupMetadata) {
    setupMetadata = await prisma.setupMetadata.create({
      data: {
        configured: false,
        initializedAt: new Date(),
      },
    });
  }

  const expired =
    !setupMetadata.configured &&
    setupMetadata.initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

  return {
    ...setupMetadata,
    expired,
  };
}

const getSetupMetadataCached = cache(getSetupMetadata);

export default getSetupMetadataCached;
