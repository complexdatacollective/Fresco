import { hash } from 'ohash';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { getActivities } from '~/queries/activityFeed';
import ActivityFeedTable from './ActivityFeedTable';
import { searchParamsCache } from './SearchParams';

export default function ActivityFeed() {
  const searchParams = searchParamsCache.all();
  const activitiesPromise = getActivities(searchParams);

  return (
    <Suspense
      key={hash(searchParams)}
      fallback={<DataTableSkeleton columnCount={3} filterableColumnCount={1} />}
    >
      <ActivityFeedTable activitiesPromise={activitiesPromise} />
    </Suspense>
  );
}
