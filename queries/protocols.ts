'use server';

import { stringify } from 'superjson';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

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

export const getNewAssetIds = async (assetIds: string[]) => {
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
};
