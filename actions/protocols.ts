'use server';

import { Effect } from 'effect';
import { type z } from 'zod';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { hashProtocol } from '~/lib/protocol/hashProtocol';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import { type protocolInsertSchema } from '~/schemas/protocol';
import { addEvent } from './activityFeed';

/**
 * Check if a protocol with the given hash already exists.
 * Used during protocol import to detect duplicates.
 */
export async function getProtocolByHash(protocolHash: string) {
  await requireApiAuth();

  return prisma.protocol.findFirst({
    where: { hash: protocolHash },
  });
}

/**
 * Get asset IDs that don't already exist in the database.
 * Used during protocol import to determine which assets need uploading.
 */
export async function getNewAssetIds(assetIds: string[]) {
  await requireApiAuth();

  const existingAssets = await prisma.asset.findMany({
    where: {
      assetId: {
        in: assetIds,
      },
    },
    select: {
      assetId: true,
    },
  });

  return assetIds.filter(
    (assetId) => !existingAssets.some((asset) => asset.assetId === assetId),
  );
}

// When deleting protocols we must first delete the assets associated with them
// from the cloud storage.
export async function deleteProtocols(hashes: string[]) {
  await requireApiAuth();

  const protocolsToBeDeleted = await prisma.protocol.findMany({
    where: { hash: { in: hashes } },
    select: { id: true, name: true, originalFileKey: true },
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

  const originalFileKeysToDelete = protocolsToBeDeleted
    .map((p) => p.originalFileKey)
    .filter((k): k is string => !!k);

  // We put file deletion in a separate try/catch because if it fails, we still
  // want to delete the protocol.
  try {
    // eslint-disable-next-line no-console
    console.log('deleting protocol assets and original files...');

    await deleteFilesFromStorage([
      ...assetKeysToDelete.map((a) => a.key),
      ...originalFileKeysToDelete,
    ]);
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

    safeUpdateTag('activityFeed');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('getProtocols');
    safeUpdateTag('getInterviews');
    safeUpdateTag('getParticipants');

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

async function deleteFilesFromStorage(fileKey: string | string[]) {
  await requireApiAuth();

  const keys = Array.isArray(fileKey) ? fileKey : [fileKey];
  if (keys.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No assets to delete');
    return;
  }

  const storageLayer = await getStorageLayer();

  await Effect.gen(function* () {
    const assetStorage = yield* AssetStorage;
    yield* assetStorage.deleteAssets(keys);
  }).pipe(Effect.provide(storageLayer), Effect.runPromise);
}

export async function insertProtocol(
  input: z.infer<typeof protocolInsertSchema>,
) {
  await requireApiAuth();

  const { protocol, protocolName, newAssets, existingAssetIds, originalFile } =
    input;

  try {
    const protocolHash = hashProtocol(protocol);

    await prisma.protocol.create({
      data: {
        hash: protocolHash,
        lastModified: protocol.lastModified ?? new Date(),
        name: protocolName,
        schemaVersion: protocol.schemaVersion,
        stages: protocol.stages,
        codebook: protocol.codebook,
        description: protocol.description,
        originalFileKey: originalFile.key,
        originalFileUrl: originalFile.url,
        assets: {
          create: newAssets,
          connect: existingAssetIds.map((assetId: string) => ({ assetId })),
        },
        experiments: protocol.experiments ?? Prisma.JsonNull,
      },
    });

    void addEvent('Protocol Installed', `Protocol "${protocolName}" installed`);

    safeUpdateTag('getProtocols');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');

    return { error: null, success: true };
  } catch (e) {
    // Attempt to delete any files we uploaded to storage (assets + original)
    const keysToCleanUp = [
      ...newAssets.map((a: { key: string }) => a.key),
      originalFile.key,
    ];
    void deleteFilesFromStorage(keysToCleanUp);
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
