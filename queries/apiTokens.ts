import { cacheLife } from 'next/cache';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

export async function getApiTokens() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getApiTokens');

  const tokens = await prisma.apiToken.findMany({
    select: {
      id: true,
      description: true,
      createdAt: true,
      lastUsedAt: true,
      isActive: true,
      // Never return the actual token in list queries
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tokens;
}

export type GetApiTokensReturnType = Awaited<ReturnType<typeof getApiTokens>>;
