'use server';

import { stringify } from 'superjson';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function prisma_getApiTokens() {
  return prisma.apiToken.findMany({
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
}

export type GetApiTokensQuery = Awaited<ReturnType<typeof prisma_getApiTokens>>;

export const getApiTokens = createCachedFunction(async () => {
  const tokens = await prisma_getApiTokens();
  const safeTokens = stringify(tokens);
  return safeTokens;
}, ['getApiTokens']);
