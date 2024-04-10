'use client';

import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import { api } from '~/trpc/client';
import ActivityFeedTable from './ActivityFeedTable';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';

export const ActivityFeed = () => {
  const { searchParams } = useTableStateFromSearchParams();
  const { data, isLoading } =
    api.dashboard.getActivities.useQuery(searchParams);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} filterableColumnCount={1} />;
  }

  return <ActivityFeedTable tableData={data ?? { events: [], pageCount: 0 }} />;
};
