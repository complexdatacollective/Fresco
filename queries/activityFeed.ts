import { cacheLife } from 'next/cache';
import 'server-only';
import { type SearchParams } from '~/app/dashboard/_components/ActivityFeed/types';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import type { Prisma } from '~/lib/db/generated/client';

export async function fetchActivities(rawSearchParams: unknown) {
  'use cache';
  cacheLife('max');
  safeCacheTag('activityFeed');

  const searchParams = rawSearchParams as SearchParams;

  const { page, perPage, sort, sortField, q, type } = searchParams;

  const offset = page > 0 ? (page - 1) * perPage : 0;

  const where: Prisma.EventsWhereInput = {};
  if (q) {
    where.message = { contains: q };
  }
  if (type && type.length > 0) {
    where.type = { in: type };
  }

  const [count, events] = await Promise.all([
    prisma.events.count({ where }),
    prisma.events.findMany({
      take: perPage,
      skip: offset,
      orderBy:
        sort === 'none'
          ? [{ timestamp: 'desc' }, { id: 'desc' }]
          : [{ [sortField]: sort }, { id: sort }],
      where,
    }),
  ]);

  const pageCount = Math.ceil(count / perPage);
  return { events, pageCount };
}

export type ActivitiesFeed = ReturnType<typeof fetchActivities>;
