'use server';

import { prisma } from '~/lib/db';
import { getUTApi } from '~/lib/uploadthing/server-helpers';

// Completed previews: 24 hours
const MAX_COMPLETED_PREVIEW_AGE_MS = 24 * 60 * 60 * 1000;
// Pending (abandoned) uploads: 15 minutes
const MAX_PENDING_PREVIEW_AGE_MS = 15 * 60 * 1000;

/**
 * Prune preview protocols based on age limit.
 * - Pending protocols (abandoned uploads) are deleted after 15 minutes
 * - Completed protocols are deleted after 24 hours
 * Also cleans up orphaned assets and participants.
 */
export async function prunePreviewProtocols(): Promise<{
  deletedCount: number;
  error?: string;
}> {
  try {
    const now = new Date();
    const completedCutoff = new Date(
      now.getTime() - MAX_COMPLETED_PREVIEW_AGE_MS,
    );
    const pendingCutoff = new Date(now.getTime() - MAX_PENDING_PREVIEW_AGE_MS);

    // Find preview protocols to prune:
    // - Pending protocols older than 15 minutes (abandoned uploads)
    // - Completed protocols older than 24 hours
    const oldProtocols = await prisma.protocol.findMany({
      where: {
        isPreview: true,
        OR: [
          { isPending: true, importedAt: { lt: pendingCutoff } },
          { isPending: false, importedAt: { lt: completedCutoff } },
        ],
      },
      select: {
        id: true,
        hash: true,
        name: true,
      },
    });

    if (oldProtocols.length === 0) {
      return { deletedCount: 0 };
    }

    const protocolIds = oldProtocols.map((p) => p.id);

    // Select assets that are ONLY associated with the protocols to be deleted
    const assetKeysToDelete = await prisma.asset.findMany({
      where: {
        protocols: {
          every: {
            id: {
              in: protocolIds,
            },
          },
        },
      },
      select: { key: true },
    });

    // Delete assets from UploadThing (best effort)
    if (assetKeysToDelete.length > 0) {
      try {
        const utapi = await getUTApi();
        await utapi.deleteFiles(assetKeysToDelete.map((a) => a.key));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting preview protocol assets:', error);
      }
    }

    // Delete assets from database
    if (assetKeysToDelete.length > 0) {
      await prisma.asset.deleteMany({
        where: {
          key: {
            in: assetKeysToDelete.map((a) => a.key),
          },
        },
      });
    }

    // Delete the protocols
    const result = await prisma.protocol.deleteMany({
      where: {
        id: {
          in: protocolIds,
        },
      },
    });

    return { deletedCount: result.count };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error pruning preview protocols:', error);
    return {
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
