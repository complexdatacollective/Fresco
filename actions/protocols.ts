'use server';

import { type Protocol } from '@codaco/shared-consts';
import { Prisma } from '@prisma/client';
import { safeRevalidateTag } from 'lib/cache';
import { hash } from 'ohash';
import { UTApi } from 'uploadthing/server';
import { type z } from 'zod';
import { protocolInsertSchema } from '~/schemas/protocol';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { addEvent } from './activityFeed';

// When deleting protocols we must first delete the assets associated with them
// from the cloud storage.
export async function deleteProtocols(hashes: string[]) {
  await requireApiAuth();

  const protocolsToBeDeleted = await prisma.protocol.findMany({
    where: { hash: { in: hashes } },
    select: { id: true, name: true },
  });

  // Select assets that are ONLY associated with the protocols to be deleted
  const assetKeysToDelete = await prisma.asset.findMany({
    where: {
      protocols: {
        every: {
          id: {
            in: protocolsToBeDeleted.map((p) => p.id),
          },
        },
      },
    },
    select: { key: true },
  });

  // We put asset deletion in a separate try/catch because if it fails, we still
  // want to delete the protocol.
  try {
    // eslint-disable-next-line no-console
    console.log('deleting protocol assets...');

    await deleteFilesFromUploadThing(assetKeysToDelete.map((a) => a.key));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting protocol assets!', error);
  }

  // Delete assets in assetKeysToDelete from the database

  try {
    // eslint-disable-next-line no-console
    console.log('deleting assets from database...');
    await prisma.asset.deleteMany({
      where: {
        key: {
          in: assetKeysToDelete.map((a) => a.key),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting assets from database!', error);
  }

  try {
    const deletedProtocols = await prisma.protocol.deleteMany({
      where: { hash: { in: hashes } },
    });

    // insert an event for each protocol deleted
    // eslint-disable-next-line no-console
    console.log('inserting events for deleted protocols...');
    const events = protocolsToBeDeleted.map((p) => {
      return {
        type: 'Protocol Uninstalled',
        message: `Protocol "${p.name}" uninstalled`,
      };
    });

    await prisma.events.createMany({
      data: events,
    });

    safeRevalidateTag('activityFeed');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('getProtocols');
    safeRevalidateTag('getInterviews');
    safeRevalidateTag('getParticipants');

    return { error: null, deletedProtocols: deletedProtocols };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('delete protocols error: ', error);
    return {
      error: 'Failed to delete protocols',
      deletedProtocols: null,
    };
  }
}

async function deleteFilesFromUploadThing(fileKey: string | string[]) {
  await requireApiAuth();

  if (fileKey.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No assets to delete');
    return;
  }

  const utapi = new UTApi();

  const response = await utapi.deleteFiles(fileKey);

  if (!response.success) {
    throw new Error('Failed to delete files from uploadthing');
  }

  return;
}

export async function insertProtocol(
  input: z.infer<typeof protocolInsertSchema>,
) {
  await requireApiAuth();

  const {
    protocol: inputProtocol,
    protocolName,
    newAssets,
    existingAssetIds,
  } = protocolInsertSchema.parse(input);

  const protocol = inputProtocol as Protocol;

  try {
    const protocolHash = hash(protocol);

    await prisma.protocol.create({
      data: {
        hash: protocolHash,
        lastModified: protocol.lastModified,
        name: protocolName,
        schemaVersion: protocol.schemaVersion,
        stages: protocol.stages as unknown as Prisma.JsonArray, // The Stage interface needs to be changed to be a type: https://www.totaltypescript.com/type-vs-interface-which-should-you-use#index-signatures-in-types-vs-interfaces
        codebook: protocol.codebook,
        description: protocol.description,
        assets: {
          create: newAssets,
          connect: existingAssetIds.map((assetId) => ({ assetId })),
        },
      },
    });

    void addEvent('Protocol Installed', `Protocol "${protocolName}" installed`);

    safeRevalidateTag('getProtocols');
    safeRevalidateTag('summaryStatistics');

    return { error: null, success: true };
  } catch (e) {
    // Attempt to delete any assets we uploaded to storage
    if (newAssets.length > 0) {
      void deleteFilesFromUploadThing(newAssets.map((a) => a.key));
    }
    // Check for protocol already existing
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return {
          error:
            'The protocol you attempted to add already exists in the database. Please remove it and try again.',
          success: false,
          errorDetails: e,
        };
      }

      return {
        error:
          'There was an error adding your protocol to the database. See the error details for more information.',
        success: false,
        errorDetails: e,
      };
    }

    throw e;
  }
}
