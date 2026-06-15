import { cacheLife } from 'next/cache';
import { stringify } from 'superjson';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function prisma_getProtocols() {
  return prisma.protocol.findMany({
    include: {
      // Only the interview fields consumers actually read (DeleteProtocolsDialog
      // uses the count + export status). Including full interviews pulls every
      // network blob (~37MB at 3k interviews), exceeding the cache item size
      // limit — which makes this query uncacheable and re-run on every render.
      interviews: {
        select: { exportTime: true },
      },
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
