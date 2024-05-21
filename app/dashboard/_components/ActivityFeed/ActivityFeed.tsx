'use client';

import { useQuery } from '@tanstack/react-query';
import { hash } from 'ohash';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ActivityFeedTable from './ActivityFeedTable';
import { useTableStateFromSearchParams } from './useTableStateFromSearchParams';

const ActivityFeed = () => {
  const { searchParams } = useTableStateFromSearchParams();

  function convertObjectToStringRecord(
    obj: Record<string, unknown>,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = String(obj[key]);
      }
    }
    return result;
  }

  const params = convertObjectToStringRecord(searchParams);

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
