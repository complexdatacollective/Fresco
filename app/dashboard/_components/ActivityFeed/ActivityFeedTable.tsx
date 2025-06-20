'use client';

import type { Events } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { use, useMemo } from 'react';
import { DataTable } from '~/components/data-table/data-table';
import { useDataTable } from '~/hooks/use-data-table';
import type { ActivitiesFeed } from '~/queries/activityFeed';
import {
  fetchActivityFeedTableColumnDefs,
  filterableColumns,
  searchableColumns,
} from './ColumnDefinition';

export default function ActivityFeedTable({
  activitiesPromise,
}: {
  activitiesPromise: ActivitiesFeed;
}) {
  const tableData = use(activitiesPromise);

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  const { dataTable } = useDataTable({
    data: tableData.events,
    columns,
    pageCount: tableData.pageCount,
    searchableColumns,
    filterableColumns,
  });

  return (
    <DataTable
      data-testid="activity-feed"
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
    />
  );
}
