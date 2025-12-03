import { getUTApi } from '~/lib/uploadthing-server-helpers';
import { prisma } from '~/utils/db';

const MAX_PREVIEW_PROTOCOL_AGE_HOURS = 24;

/**
 * Prune preview protocols based on age limit.
 * Deletes protocols older than 24 hours, along with their
 * orphaned assets and participants.
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

    // Find participants whose interviews are ALL with the protocols to be deleted
    // These will become orphaned after cascade delete
    const participantsToDelete = await prisma.participant.findMany({
      where: {
        interviews: {
          some: {}, // Has at least one interview
          every: {
            protocolId: {
              in: protocolIds,
            },
          },
        },
      },
      select: { id: true },
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

    // Delete the protocols (interviews cascade delete automatically)
    const result = await prisma.protocol.deleteMany({
      where: {
        id: {
          in: protocolIds,
        },
      },
    });

    // Delete orphaned participants (their interviews were cascade deleted above)
    if (participantsToDelete.length > 0) {
      await prisma.participant.deleteMany({
        where: {
          id: {
            in: participantsToDelete.map((p) => p.id),
          },
        },
      });
    }

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
