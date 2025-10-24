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
};

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  searchableColumnCount = 1,
  filterableColumnCount = 1,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-4 overflow-auto">
      <div className="flex w-full items-center justify-between space-x-2 overflow-auto">
        <div className="flex flex-1 items-center space-x-2">
          {searchableColumnCount > 0
            ? Array.from({ length: searchableColumnCount }).map((_, i) => (
                <Skeleton key={i} className="laptop:w-[250px] h-7 w-[150px]" />
              ))
            : null}
          {filterableColumnCount > 0
            ? Array.from({ length: filterableColumnCount }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-[70px] border-dashed" />
              ))
            : null}
        </div>
        {/* <Skeleton className="ml-auto hidden h-7 w-[70px] laptop:flex" /> */}
      </div>
      <Table>
        <TableHeader>
          {Array.from({ length: 1 }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableCell key={i}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="tablet:flex-row tablet:gap-8 flex w-full flex-col items-center justify-between gap-4 overflow-auto px-2 py-1">
        <div className="flex-1">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="tablet:flex-row tablet:gap-6 laptop:gap-8 flex flex-col items-center gap-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="laptop:block hidden size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="laptop:block hidden size-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
