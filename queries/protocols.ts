'use server';

import { stringify } from 'superjson';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function prisma_getProtocols() {
  return prisma.protocol.findMany({
    where: {
      isPreview: false,
    },
    include: {
      interviews: true,
    },
  });
}

export type GetProtocolsQuery = Awaited<ReturnType<typeof prisma_getProtocols>>;

export const getProtocols = createCachedFunction(async () => {
  const protocols = await prisma_getProtocols();
  const safeProtocols = stringify(protocols);
  return safeProtocols;
}, ['getProtocols']);

export type GetProtocolsReturnType = ReturnType<typeof getProtocols>;

export const getProtocolByHash = createCachedFunction(
  async (hash: string) => {
    const protocol = await prisma.protocol.findFirst({
      where: {
        hash,
      },
    });

    return protocol;
  },
  ['getProtocolsByHash', 'getProtocols'],
);

/**
 * Find existing assets by assetId that are safe to reuse.
 * Excludes assets that are ONLY associated with pending preview protocols,
 * as these may have failed/stuck uploads with invalid URLs.
 */
export const getExistingAssets = async (assetIds: string[]) => {
  return prisma.asset.findMany({
    where: {
      assetId: {
        in: assetIds,
      },
      // Exclude assets that are ONLY associated with pending preview protocols
      // An asset is safe to reuse if it has at least one non-pending protocol
      protocols: {
        some: {
          OR: [
            { isPending: false },
            { isPreview: false },
          ],
        },
      },
    },
    select: {
      assetId: true,
      key: true,
      url: true,
      type: true,
    },
  });
};

export const getNewAssetIds = async (assetIds: string[]) => {
  const existingAssets = await getExistingAssets(assetIds);
  // Return the assetIds that are not in the database
  return assetIds.filter(
    (assetId) => !existingAssets.some((asset) => asset.assetId === assetId),
  );
};

/**
 * Fetches the preview protocol with assets for preview mode.
 */
export async function getProtocolForPreview(protocolId: string) {
  return prisma.protocol.findUnique({
    where: { id: protocolId },
    include: { assets: true },
    omit: {
      lastModified: true,
      hash: true,
    },
  });
}
