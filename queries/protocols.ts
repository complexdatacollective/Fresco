'use server';

import { unstable_cache } from 'next/cache';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export const getProtocols = async () => {
  await requireApiAuth();

  const protocols = await prisma.protocol.findMany({
    include: { interviews: true },
  });

  return protocols;
};

export type GetProtocolsType = typeof getProtocols;
export type GetProtocolsReturnType = ReturnType<typeof getProtocols>;

export const getProtocolByHash = async (hash: string) => {
  await requireApiAuth();
  const protocol = await prisma.protocol.findFirst({
    where: {
      hash,
    },
  });

  return protocol;
};

export type GetProtocolByHashType = typeof getProtocolByHash;
export type GetProtocolByHashReturnType = ReturnType<typeof getProtocolByHash>;

export const getProtocolByLastUpdated = async () => {
  await requireApiAuth();
  const protocol = await prisma.protocol.findFirst({
    orderBy: {
      importedAt: 'desc',
    },
  });

  return protocol;
};

export type GetProtocolByLastUpdatedType = typeof getProtocolByLastUpdated;
export type GetProtocolByLastUpdatedReturnType = ReturnType<
  typeof getProtocolByLastUpdated
>;

export const getExistingAssetIds = async (assetIds: string[]) => {
  await requireApiAuth();

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

export type GetExistingAssetIdsType = typeof getExistingAssetIds;
export type GetExistingAssetIdsReturnType = ReturnType<
  typeof getExistingAssetIds
>;
