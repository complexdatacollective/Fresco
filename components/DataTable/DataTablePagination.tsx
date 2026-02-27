import { type Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { IconButton } from '~/components/ui/Button';
import SelectField from '~/lib/form/components/fields/Select/Native';
import Paragraph from '../typography/Paragraph';
import { pageSizes } from './types';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const showPageCount = pageCount > 0;

  return (
    <div className="tablet:flex-row tablet:gap-6 laptop:gap-8 mx-auto flex w-fit flex-col items-center justify-between gap-4">
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
          onChange={(value) => {
            table.setPageSize(Number(value));
          }}
          options={pageSizes.map((size) => ({
            label: size.toLocaleString(),
            value: size,
          }))}
          placeholder={table.getState().pagination.pageSize.toLocaleString()}
        />
      </div>
      {showPageCount && (
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {pageCount}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <IconButton
          aria-label="Go to first page"
          variant="text"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          icon={<ChevronsLeft />}
        />
        <IconButton
          aria-label="Go to previous page"
          variant="text"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          icon={<ChevronLeft />}
        />
        <IconButton
          aria-label="Go to next page"
          variant="text"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          icon={<ChevronRight />}
        />
        <IconButton
          aria-label="Go to last page"
          variant="text"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          icon={<ChevronsRight />}
        />
      </div>
    </div>
  );
}
