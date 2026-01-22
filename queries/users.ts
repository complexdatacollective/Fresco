import 'server-only';

import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';

export const getUsers = createCachedFunction(async () => {
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
}, ['getUsers']);

export type GetUsersReturnType = Awaited<ReturnType<typeof getUsers>>;
