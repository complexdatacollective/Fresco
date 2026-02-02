import { Skeleton } from '~/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

type DataTableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
  searchableColumnCount?: number;
  filterableColumnCount?: number;
  headerItemsCount?: number;
};

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  searchableColumnCount = 0,
  filterableColumnCount = 0,
  headerItemsCount = 0,
}: DataTableSkeletonProps) {
  const hasToolbar =
    searchableColumnCount > 0 ||
    filterableColumnCount > 0 ||
    headerItemsCount > 0;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Toolbar skeleton */}
      {hasToolbar && (
        <div className="mx-auto flex w-fit items-center gap-2">
          {searchableColumnCount > 0
            ? Array.from({ length: searchableColumnCount }).map((_, i) => (
                <Skeleton key={`search-${i}`} className="h-9 w-[250px]" />
              ))
            : null}
          {filterableColumnCount > 0
            ? Array.from({ length: filterableColumnCount }).map((_, i) => (
                <Skeleton
                  key={`filter-${i}`}
                  className="h-7 w-[70px] border-dashed"
                />
              ))
            : null}
          {headerItemsCount > 0
            ? Array.from({ length: headerItemsCount }).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-9 w-24" />
              ))
            : null}
        </div>
      )}

      {/* Table skeleton */}
      <Table surfaceProps={{ className: 'min-w-fit' }}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i} className="min-w-32">
                <Skeleton className="h-6 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j} className="min-w-32">
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination skeleton */}
      <div className="mx-auto w-fit">
        <div className="tablet:flex-row tablet:gap-6 laptop:gap-8 flex flex-col items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <div className="flex w-[100px] items-center justify-center">
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
