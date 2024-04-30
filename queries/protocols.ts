import { unstable_cache } from 'next/cache';
import { prisma } from '~/utils/db';
import 'server-only';

export const getProtocols = unstable_cache(
  async () => {
    const protocols = await prisma.protocol.findMany({
      include: { interviews: true },
    });

    return protocols;
  },
  ['getProtocols'],
  {
    tags: ['getProtocols'],
  },
);

export type GetProtocolsType = typeof getProtocols;
export type GetProtocolsReturnType = ReturnType<typeof getProtocols>;

export const getProtocolByHash = unstable_cache(
  async (hash: string) => {
    const protocol = await prisma.protocol.findFirst({
      where: {
        hash,
      },
    });

    return protocol;
  },
  ['getProtocolsByHash'],
  {
    tags: ['getProtocolsByHash', 'getProtocols'],
  },
);

export type GetProtocolByHashType = typeof getProtocolByHash;
export type GetProtocolByHashReturnType = ReturnType<typeof getProtocolByHash>;

export const getProtocolByLastUpdated = unstable_cache(
  async () => {
    const protocol = await prisma.protocol.findFirst({
      orderBy: {
        importedAt: 'desc',
      },
    });

    return protocol;
  },
  ['getProtocolByLastUpdated'],
  {
    tags: ['getProtocolByLastUpdated', 'getProtocols'],
  },
);

export type GetProtocolByLastUpdatedType = typeof getProtocolByLastUpdated;
export type GetProtocolByLastUpdatedReturnType = ReturnType<
  typeof getProtocolByLastUpdated
>;

export const getExistingAssetIds = unstable_cache(
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
  ['getExistingAssetIds'],
  {
    tags: ['getExistingAssetIds', 'getProtocols'],
  },
);

export type GetExistingAssetIdsType = typeof getExistingAssetIds;
export type GetExistingAssetIdsReturnType = ReturnType<
  typeof getExistingAssetIds
>;
