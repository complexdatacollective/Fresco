/* eslint-disable local-rules/require-data-mapper */
import type { SetupMetadata } from '@prisma/client';
import { cache } from 'react';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { prisma } from '~/utils/db';

type SetupMetadataWithExpired = SetupMetadata & {
  expired: boolean;
};

async function getSetupMetadata(): Promise<SetupMetadataWithExpired> {
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

  return {
    ...setupMetadata,
    expired:
      setupMetadata.initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT,
  };
}

const getSetupMetadataCached = cache(getSetupMetadata);

export default getSetupMetadataCached;
