'use client';

import { useQuery } from '@tanstack/react-query';
import { hash } from 'ohash';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';

const ActivityFeed = () => {
  const { searchParams } = useTableStateFromSearchParams();

  // Stringify filterParams
  const filterParams = JSON.stringify(searchParams.filterParams);

  // Convert all values to strings
  const params = {
    page: String(searchParams.page),
    perPage: String(searchParams.perPage),
    sort: searchParams.sort,
    sortField: searchParams.sortField,
    filterParams,
  };

  const { isLoading, data } = useQuery({
    queryKey: ['activities', hash(params)],
    queryFn: () =>
      fetch('/api/activities?' + new URLSearchParams(params).toString()).then(
        (res) => res.json(),
      ),
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} filterableColumnCount={1} />;
  }

  return <ActivityFeedTable tableData={data ?? { events: [], pageCount: 0 }} />;
};

export default ActivityFeed;
