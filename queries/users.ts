import 'server-only';
import { cacheLife } from 'next/cache';

import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

export async function getUsers() {
  'use cache';
  cacheLife('max');
  safeCacheTag('getUsers');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
    },
    orderBy: {
      username: 'asc',
    },
  });

  return users;
}

export type GetUsersReturnType = Awaited<ReturnType<typeof getUsers>>;
