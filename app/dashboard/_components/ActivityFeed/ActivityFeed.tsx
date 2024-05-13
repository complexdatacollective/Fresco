import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { Suspense } from 'react';
import { searchParamsCache } from './searchParamsCache';
import { getActivities } from '~/queries/activityFeed';

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
