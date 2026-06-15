'use client';

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { FileUp, Trash } from 'lucide-react';
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { use, useMemo, type ReactNode } from 'react';
import superjson from 'superjson';
import { Button } from '@codaco/fresco-ui/Button';
import { DataTable } from '@codaco/fresco-ui/DataTable/DataTable';
import { DataTableFloatingBar } from '@codaco/fresco-ui/DataTable/DataTableFloatingBar';
import { useNuqsTable } from '~/components/DataTable/nuqs/NuqsTableProvider';
import type {
  GetInterviewsQuery,
  GetInterviewsReturnType,
} from '~/queries/interviews';
import { searchParamsUrlKeys, sortableFields, sortOrder } from './searchParams';

type InterviewRow = GetInterviewsQuery[number];

export default function InterviewsTableRows({
  interviewsPromise,
  rowSelection,
  onRowSelectionChange,
  columns,
  toolbar,
  onDeleteSelected,
  onExportSelected,
}: {
  interviewsPromise: GetInterviewsReturnType;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  columns: ColumnDef<InterviewRow, unknown>[];
  toolbar: ReactNode;
  onDeleteSelected: (interviews: InterviewRow[]) => void;
  onExportSelected: (interviewIds: string[]) => void;
}) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const data = use(interviewsPromise);
  const rows = useMemo(
    () => superjson.parse<GetInterviewsQuery>(data.rows),
    [data.rows],
  );
  const { startTransition } = useNuqsTable();

  // Only pagination + sort are read/written here. Filters are owned by the
  // toolbar's Nuqs* components, and filtering happens server-side, so this
  // table runs in manual mode and never mirrors filters into column state.
  const [{ page, perPage, sort, sortField }, setTableState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(10),
      sort: parseAsStringLiteral(sortOrder).withDefault('none'),
      sortField:
        parseAsStringLiteral(sortableFields).withDefault('lastUpdated'),
    },
    {
      urlKeys: searchParamsUrlKeys,
      shallow: false,
      clearOnDefault: true,
      startTransition,
    },
  );

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: perPage,
  };

  const sorting: SortingState =
    sort === 'none' ? [] : [{ id: sortField, desc: sort === 'desc' }];

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: data.pageCount,
    getRowId: (row) => row.id,
    state: { pagination, sorting, rowSelection },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      void setTableState({
        page: next.pageIndex + 1,
        perPage: next.pageSize,
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (!first) {
        void setTableState({ sort: null, sortField: null });
        return;
      }
      const field = sortableFields.find((f) => f === first.id);
      if (!field) return;
      void setTableState({
        sort: first.desc ? 'desc' : 'asc',
        sortField: field,
      });
    },
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <DataTable
      table={table}
      toolbar={toolbar}
      floatingBar={
        <DataTableFloatingBar table={table}>
          <Button
            onClick={() =>
              onDeleteSelected(
                table.getSelectedRowModel().rows.map((r) => r.original),
              )
            }
            color="destructive"
            icon={<Trash className="size-4" />}
          >
            Delete Selected
          </Button>
          <Button
            onClick={() => onExportSelected(Object.keys(rowSelection))}
            icon={<FileUp className="size-4" />}
          >
            Export Selected
          </Button>
        </DataTableFloatingBar>
      }
    />
  );
}
