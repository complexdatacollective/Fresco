import { getUTApi } from '~/lib/uploadthing-server-helpers';
import { prisma } from '~/utils/db';

const MAX_PREVIEW_PROTOCOL_AGE_HOURS = 24;

/**
 * Prune preview protocols based on age limit.
 * Deletes protocols older than 24 hours.
 */
export async function prunePreviewProtocols(): Promise<{
  deletedCount: number;
  error?: string;
}> {
  try {
    const now = new Date();
    const cutoffDate = new Date(
      now.getTime() - MAX_PREVIEW_PROTOCOL_AGE_HOURS * 60 * 60 * 1000,
    );

    // Find all preview protocols older than the cutoff date
    const oldProtocols = await prisma.protocol.findMany({
      where: {
        isPreview: true,
        importedAt: {
          lt: cutoffDate,
        },
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

    // Select assets that are ONLY associated with the protocols to be deleted
    const assetKeysToDelete = await prisma.asset.findMany({
      where: {
        protocols: {
          every: {
            id: {
              in: oldProtocols.map((p) => p.id),
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
          in: oldProtocols.map((p) => p.id),
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
