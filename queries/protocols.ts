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
