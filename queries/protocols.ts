import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function prisma_getProtocols() {
  return prisma.protocol.findMany({
    include: {
      interviews: true,
    },
  });
}

export type GetProtocolsQuery = Awaited<ReturnType<typeof prisma_getProtocols>>;

export async function getProtocols() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getProtocols');

  const protocols = await prisma_getProtocols();
  const safeProtocols = stringify(protocols);
  return safeProtocols;
}

export type GetProtocolsReturnType = ReturnType<typeof getProtocols>;

export const getExistingAssets = async (assetIds: string[]) => {
  return prisma.asset.findMany({
    where: {
      assetId: {
        in: assetIds,
      },
      // Asset is safe to reuse if it's associated with:
      // - Any regular protocol, OR
      // - A non-pending preview protocol (completed upload)
      OR: [
        { protocols: { some: {} } },
        { previewProtocols: { some: { isPending: false } } },
      ],
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
  return prisma.previewProtocol.findUnique({
    where: { id: protocolId },
    include: { assets: true },
    omit: {
      lastModified: true,
      hash: true,
    },
  });
}
