import { getUTApi } from '~/lib/uploadthing-server-helpers';
import { prisma } from '~/utils/db';

const MAX_PREVIEW_PROTOCOL_AGE_HOURS = 24;
const MAX_PREVIEW_PROTOCOL_COUNT = 25;

/**
 * Prune preview protocols based on age and count limits.
 * - Deletes protocols older than 24 hours
 * - Deletes oldest protocols if more than 25 exist for a given hash
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

    // Find preview protocols that exceed the count limit (grouped by hash)
    // We need to find duplicates and keep only the most recent MAX_PREVIEW_PROTOCOL_COUNT
    const allPreviewProtocols = await prisma.protocol.findMany({
      where: {
        isPreview: true,
      },
      select: {
        id: true,
        hash: true,
        name: true,
        importedAt: true,
      },
      orderBy: {
        importedAt: 'desc',
      },
    });

    // Group by hash and find excess protocols
    const protocolsByHash = new Map<string, typeof allPreviewProtocols>();
    for (const protocol of allPreviewProtocols) {
      const existing = protocolsByHash.get(protocol.hash) ?? [];
      protocolsByHash.set(protocol.hash, [...existing, protocol]);
    }

    const excessProtocols: { id: string; hash: string; name: string }[] = [];
    for (const [, protocols] of protocolsByHash) {
      if (protocols.length > MAX_PREVIEW_PROTOCOL_COUNT) {
        // Keep the most recent MAX_PREVIEW_PROTOCOL_COUNT, delete the rest
        const toDelete = protocols.slice(MAX_PREVIEW_PROTOCOL_COUNT);
        excessProtocols.push(...toDelete);
      }
    }

    // Combine old and excess protocols
    const protocolsToDelete = [
      ...oldProtocols,
      ...excessProtocols.filter(
        (p) => !oldProtocols.some((old) => old.id === p.id),
      ),
    ];

    if (protocolsToDelete.length === 0) {
      return { deletedCount: 0 };
    }

    // Select assets that are ONLY associated with the protocols to be deleted
    const assetKeysToDelete = await prisma.asset.findMany({
      where: {
        protocols: {
          every: {
            id: {
              in: protocolsToDelete.map((p) => p.id),
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
          in: protocolsToDelete.map((p) => p.id),
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

/**
 * Increment the upload count for a preview protocol or create a new version.
 * Returns the protocol ID to use for the interview.
 */
export async function handlePreviewProtocolUpload(
  hash: string,
): Promise<{ protocolId: string | null; shouldCreateNew: boolean }> {
  // Check if a preview protocol with this hash already exists
  const existing = await prisma.protocol.findFirst({
    where: {
      hash,
      isPreview: true,
    },
    orderBy: {
      importedAt: 'desc',
    },
  });

  if (!existing) {
    return { protocolId: null, shouldCreateNew: true };
  }

  // Increment the upload count
  const updated = await prisma.protocol.update({
    where: { id: existing.id },
    data: {
      uploadCount: {
        increment: 1,
      },
    },
  });

  return { protocolId: updated.id, shouldCreateNew: false };
}
