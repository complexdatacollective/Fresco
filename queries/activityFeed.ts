import 'server-only';
import { cacheLife } from 'next/cache';
import { type SearchParams } from '~/app/dashboard/_components/ActivityFeed/types';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

async function fetchActivities(rawSearchParams: unknown) {
  'use cache';
  cacheLife('max');
  safeCacheTag('activityFeed');

  const searchParams = rawSearchParams as SearchParams;

  const { page, perPage, sort, sortField, filterParams } = searchParams;

  // Number of items to skip
  const offset = page > 0 ? (page - 1) * perPage : 0;

  // Generate the dynamic filter parameters for the database call from the
  // input filter params.
  const queryFilterParams = filterParams
    ? {
        OR: [
          ...filterParams.map(({ id, value }) => {
            const operator = Array.isArray(value) ? 'in' : 'contains';
            return {
              [id]: { [operator]: value },
            };
          }),
        ],
      }
    : {};

  const [count, events] = await Promise.all([
    prisma.events.count({
      where: {
        ...queryFilterParams,
      },
    }),
    prisma.events.findMany({
      take: perPage,
      skip: offset,
      orderBy:
        sort === 'none'
          ? [{ timestamp: 'desc' }, { id: 'desc' }]
          : [{ [sortField]: sort }, { id: sort }],
      where: {
        ...queryFilterParams,
      },
    }),
  ]);

  const pageCount = Math.ceil(count / perPage);
  return { events, pageCount };
}

export const getActivities = (rawSearchParams: unknown) =>
  fetchActivities(rawSearchParams);

export type ActivitiesFeed = ReturnType<typeof getActivities>;
