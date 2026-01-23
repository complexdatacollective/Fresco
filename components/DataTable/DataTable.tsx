'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type Table as TTable,
} from '@tanstack/react-table';
import { FileUp, Loader, Search, Trash } from 'lucide-react';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsMounted } from 'usehooks-ts';
import { makeDefaultColumns } from '~/components/DataTable/DefaultColumns';
import { Button } from '~/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import InputField from '~/lib/form/components/fields/InputField';
import { MotionSurface } from '../layout/Surface';
import { DataTablePagination } from './Pagination';

type CustomTable<TData> = TTable<TData> & {
  options?: {
    meta?: {
      getRowClasses?: (row: Row<TData>) => string | undefined;
      navigatorLanguages?: string[];
    };
  };
};

type DataTableProps<TData, TValue> = {
  columns?: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumnAccessorKey?: string;
  handleDeleteSelected?: (data: TData[]) => Promise<void> | void;
  handleExportSelected?: (data: TData[]) => void;
  actions?: React.ComponentType<{
    row: Row<TData>;
    data: TData[];
    deleteHandler: (item: TData) => void;
  }>;
  actionsHeader?: React.ReactNode;
  calculateRowClasses?: (row: Row<TData>) => string | undefined;
  headerItems?: React.ReactNode;
  defaultSortBy?: SortingState[0];
  surfaceLevel?: 0 | 1 | 2 | 3;
};

export function DataTable<TData, TValue>({
  columns = [],
  data,
  handleDeleteSelected,
  handleExportSelected,
  filterColumnAccessorKey = '',
  actions,
  actionsHeader,
  calculateRowClasses,
  headerItems,
  defaultSortBy,
  surfaceLevel = 0,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const mounted = useIsMounted();

  if (columns.length === 0) {
    columns = makeDefaultColumns(data);
  }

  const deleteHandler = async () => {
    setIsDeleting(true);
    const selectedData = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);

    try {
      await handleDeleteSelected?.(selectedData);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('An unknown error occurred.');
    }

    setIsDeleting(false);
    setRowSelection({});
  };

  if (actions) {
    const actionsColumn = {
      id: 'actions',
      header: () => actionsHeader ?? null,
      cell: ({ row }: { row: Row<TData> }) => {
        const cellDeleteHandler = async (item: TData) => {
          await handleDeleteSelected?.([item]);
        };

        return flexRender(actions, {
          row,
          data,
          deleteHandler: cellDeleteHandler,
        });
      },
    };

    columns = [...columns, actionsColumn];
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      getRowClasses: (row: Row<TData>) => calculateRowClasses?.(row),
    },
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  }) as CustomTable<TData>;

  const hasSelectedRows = table.getSelectedRowModel().rows.length > 0;

  const exportHandler = useCallback(() => {
    const selectedData = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);

    handleExportSelected?.(selectedData);

    setRowSelection({});
  }, [handleExportSelected, table, setRowSelection]);

  return (
    <div className="flex flex-col gap-6">
      {(filterColumnAccessorKey || headerItems) && (
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          {filterColumnAccessorKey && (
            <InputField
              type="search"
              prefixComponent={<Search />}
              name="filter"
              placeholder={`Filter by ${filterColumnAccessorKey}...`}
              value={
                (table
                  .getColumn(filterColumnAccessorKey)
                  ?.getFilterValue() as string) ?? ''
              }
              onChange={(value) =>
                table.getColumn(filterColumnAccessorKey)?.setFilterValue(value)
              }
              className="mt-0 w-fit shrink-0"
            />
          )}
          {headerItems}
        </div>
      )}

      <Table surfaceProps={{ level: surfaceLevel }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={table.options.meta?.getRowClasses?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div>
        <DataTablePagination table={table} />

        {/**
         * TODO: This is garbage.
         *
         * This shouldn't be part of the data table - it should be a component
         * that is passed in to the table that gets given access to the table
         * state. See the other data-table for an example.
         */}

        {mounted &&
          createPortal(
            <>
              <MotionSurface
                className="tablet:w-auto fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4"
                initial={{ opacity: 0, y: 50 }}
                animate={
                  hasSelectedRows ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                spacing="sm"
              >
                <Button
                  onClick={() => void deleteHandler()}
                  color="destructive"
                  disabled={isDeleting}
                  icon={
                    isDeleting ? (
                      <Loader className="h-4 w-4" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )
                  }
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
                {handleExportSelected && (
                  <Button
                    onClick={exportHandler}
                    color="primary"
                    className="mx-2 gap-x-2.5"
                    icon={<FileUp className="h-4 w-4" />}
                  >
                    Export Selected
                  </Button>
                )}
              </MotionSurface>
            </>,
            document.body,
          )}
      </div>
    </div>
  );
}
