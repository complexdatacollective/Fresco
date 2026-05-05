import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function prisma_getProtocols() {
  return prisma.protocol.findMany({
    where: { isPreview: false },
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
      assetId: { in: assetIds },
      // Asset is safe to reuse if it's attached to any non-pending protocol
      // (a pending preview is still mid-upload — its assets aren't confirmed).
      protocols: { some: { isPending: false } },
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
 * Fetches a protocol with assets for preview mode. Returns any protocol
 * (preview or regular) — the preview API may route here when an uploaded
 * preview's hash matches an installed protocol.
 */
export async function getProtocolForPreview(protocolId: string) {
  return prisma.protocol.findUnique({
    where: { id: protocolId },
    include: { assets: true },
    omit: {
      lastModified: true,
    },
  });
}
