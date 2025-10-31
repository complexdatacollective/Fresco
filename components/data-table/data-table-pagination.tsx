import { type Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { pageSizes } from '~/components/DataTable/types';
import { Button } from '~/components/ui/Button';
import { SelectField } from '~/lib/form/components/fields/Select';
import Paragraph from '../typography/Paragraph';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="tablet:flex-row tablet:gap-6 laptop:gap-8 flex grow-1 flex-col items-center justify-between gap-4">
      <div className="flex items-center space-x-2">
        <Paragraph
          intent="smallText"
          className="whitespace-nowrap"
          margin="none"
        >
          Rows per page
        </Paragraph>
        <SelectField
          name="pageSize"
          size="sm"
          value={`${table.getState().pagination.pageSize}`}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          options={pageSizes.map((size) => ({
            label: size.toLocaleString(),
            value: size,
          }))}
          placeholder={table.getState().pagination.pageSize.toLocaleString()}
        />
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          aria-label="Go to first page"
          variant="text"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to previous page"
          variant="text"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to next page"
          variant="text"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        <Button
          aria-label="Go to last page"
          variant="text"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
