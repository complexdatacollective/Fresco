'use server';

import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

export const getProtocols = createCachedFunction(async () => {
  const protocols = await prisma.protocol.findMany({
    include: { interviews: true },
  });

  return protocols;
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

export const getExistingAssetIds = createCachedFunction(
  async (assetIds: string[]) => {
    const assets = await prisma.asset.findMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
    });
    const existingAssets = assets.map((asset) => asset.assetId);
    // Return the assetIds that are not in the database
    return assetIds.filter((assetId) => !existingAssets.includes(assetId));
  },
  ['getExistingAssetIds', 'getProtocols'],
);
