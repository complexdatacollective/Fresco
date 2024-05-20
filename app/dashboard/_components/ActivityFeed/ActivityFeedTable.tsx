'use client';

import type { Events } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '~/components/data-table/data-table';
import { useDataTable } from '~/hooks/use-data-table';
import { type ActivitiesFeed } from '~/queries/activityFeed';
import {
  fetchActivityFeedTableColumnDefs,
  filterableColumns,
  searchableColumns,
} from './ColumnDefinition';

export default function ActivityFeedTable({
  tableData,
}: {
  tableData: unknown;
}) {
  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<Events, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(),
    [],
  );

  const data = tableData as ActivitiesFeed;

  const { dataTable } = useDataTable({
    data: data.events,
    columns,
    pageCount: data.pageCount,
    searchableColumns,
    filterableColumns,
  });

  return (
    <DataTable
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
    />
  );
}
