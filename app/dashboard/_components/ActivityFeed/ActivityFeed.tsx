import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { unstable_noStore } from 'next/cache';
import { SearchParams, SearchParamsSchema } from '~/lib/data-table/types';
import { prisma } from '~/utils/db';
import { Suspense } from 'react';
import { searchParamsCache } from './searchParamsCache';

async function getActivities(rawSearchParams: unknown) {
  unstable_noStore();

  // const searchParams = SearchParamsSchema.parse(rawSearchParams);
  const searchParams = rawSearchParams as SearchParams;

  console.log(searchParams);

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

  // Transaction is used to ensure both queries are executed in a single transaction
  const [count, events] = await prisma.$transaction([
    prisma.events.count({
      where: {
        ...queryFilterParams,
      },
    }),
    prisma.events.findMany({
      take: perPage,
      skip: offset,
      orderBy: { [sortField]: sort },
      where: {
        ...queryFilterParams,
      },
    }),
  ]);

  const pageCount = Math.ceil(count / perPage);
  return { events, pageCount };
}

export type ActivitiesFeed = ReturnType<typeof getActivities>;

export default function ActivityFeed() {
  const searchParams = searchParamsCache.all();

  const activitiesPromise = getActivities(searchParams);

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={3} filterableColumnCount={1} />}
    >
      <ActivityFeedTable activitiesPromise={activitiesPromise} />
    </Suspense>
  );
}
