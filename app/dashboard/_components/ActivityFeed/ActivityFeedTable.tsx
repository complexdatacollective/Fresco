'use client';

import { Suspense } from 'react';
import { DataTableSkeleton } from '@codaco/fresco-ui/DataTable/DataTableSkeleton';
import {
  NuqsTableProvider,
  useNuqsTable,
} from '~/components/DataTable/nuqs/NuqsTableProvider';
import type { ActivitiesFeed } from '~/queries/activityFeed';
import { cx } from '@codaco/fresco-ui/utils/cva';
import ActivityFeedRows from './ActivityFeedRows';
import ActivityFeedToolbar from './ActivityFeedToolbar';
import { ACTIVITY_FEED_PREFIX } from './SearchParams';

export default function ActivityFeedTable({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  return (
    <NuqsTableProvider prefix={ACTIVITY_FEED_PREFIX}>
      <ActivityFeedTableInner activitiesPromise={activitiesPromise} />
    </NuqsTableProvider>
  );
}

function ActivityFeedTableInner({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  const { isPending } = useNuqsTable();

  return (
    <div className="flex flex-col gap-6">
      <ActivityFeedToolbar />
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={3} filterableColumnCount={0} />
        }
      >
        <div
          className={cx(
            'transition-opacity duration-150',
            isPending && 'pointer-events-none opacity-60',
          )}
          aria-busy={isPending}
        >
          <ActivityFeedRows activitiesPromise={activitiesPromise} />
        </div>
      </Suspense>
    </div>
  );
}
