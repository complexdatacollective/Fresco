'use client';
import { use, useMemo, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDataTable } from '~/hooks/use-data-table';
import { DataTable } from '~/components/data-table/data-table';
import {
  fetchActivityFeedTableColumnDefs,
  searchableColumns,
  filterableColumns,
} from './ColumnDefinition';
import { TasksTableFloatingBarContent } from './TasksTableFloatingBarContent';
import type { Activity, Result } from './utils';

export default function ActivityFeedTable({
  activitiesPromise,
}: {
  activitiesPromise: Promise<Result>;
}) {
  const { data, pageCount } = use(activitiesPromise);
  const [isPending, startTransition] = useTransition();

  // Memoize the columns so they don't re-render on every render
  const columns = useMemo<ColumnDef<Activity, unknown>[]>(
    () => fetchActivityFeedTableColumnDefs(isPending, startTransition),
    [isPending],
  );

  const { dataTable } = useDataTable({
    data,
    columns,
    pageCount,
    searchableColumns,
    filterableColumns,
  });

  return (
    <DataTable
      dataTable={dataTable}
      columns={columns}
      searchableColumns={searchableColumns}
      filterableColumns={filterableColumns}
      floatingBarContent={TasksTableFloatingBarContent(dataTable)}
      deleteRowsAction={(_event) => {
        // eslint-disable-next-line no-console
        console.log('deleteSelectedrows, dataTable, event');
      }}
    />
  );
}
