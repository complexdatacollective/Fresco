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

export const getExistingAssets = async (assetIds: string[]) => {
  return prisma.asset.findMany({
    where: {
      assetId: {
        in: assetIds,
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
