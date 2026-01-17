'use server';

import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

export const getApiTokens = createCachedFunction(async () => {
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
}, ['getApiTokens']);

export type GetApiTokensReturnType = Awaited<ReturnType<typeof getApiTokens>>;
