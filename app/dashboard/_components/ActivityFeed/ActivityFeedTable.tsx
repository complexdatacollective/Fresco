'use client';

import type { Events } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '~/components/data-table/data-table';
import { useDataTable } from '~/hooks/use-data-table';
import {
  fetchActivityFeedTableColumnDefs,
  filterableColumns,
  searchableColumns,
} from './ColumnDefinition';

export default function ActivityFeedTable({
  tableData,
}: {
  tableData: { events: Events[]; pageCount: number };
}) {
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
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      // floatingBarContent={TasksTableFloatingBarContent(dataTable)}
      // deleteRowsAction={(_event) => {}}
    />
  );
}
