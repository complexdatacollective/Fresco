import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cx } from '~/utils/cva';
import Button, { buttonVariants } from '../ui/Button';

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const headerClasses = cx(
    buttonVariants({ variant: 'text' }),
    'pointer-events-none',
    '!-mx-8', // Adjust for padding in Button
    className,
  );

  if (!column.getCanSort()) {
    return <div className={headerClasses}>{title}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="text"
            iconPosition="right"
            className="!-mx-8" // Adjust for padding in Button
            icon={
              column.getIsSorted() === 'desc' ? (
                <ArrowDown className="text-success h-4 w-4" />
              ) : column.getIsSorted() === 'asc' ? (
                <ArrowUp className="text-success h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )
            }
          />
        }
      >
        <div className={cx(headerClasses, 'cursor-pointer')}>{title}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          aria-label="Sort ascending"
          onClick={() => column.toggleSorting(false)}
        >
          <ArrowUp className="text-background/70 mr-2 h-3.5 w-3.5" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-label="Sort descending"
          onClick={() => column.toggleSorting(true)}
        >
          <ArrowDown className="text-accent/70 mr-2 h-3.5 w-3.5" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
