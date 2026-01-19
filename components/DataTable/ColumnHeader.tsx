import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cx } from '~/utils/cva';
import { buttonVariants } from '../ui/Button';

const MotionArrow = motion.create(ArrowUp);

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
    '-mx-6!', // Adjust for padding in Button
    className,
  );

  if (!column.getCanSort()) {
    return <div className={headerClasses}>{title}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className={cx(headerClasses, 'cursor-pointer')}>
          {title}
          {column.getIsSorted() !== false ? (
            <MotionArrow
              className="text-success h-4 w-4"
              animate={column.getIsSorted() === 'asc' ? { rotate: 180 } : {}}
            />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          aria-label="Sort ascending"
          onClick={() => column.toggleSorting(false)}
        >
          <ArrowUp className="text-background/70 mr-2" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-label="Sort descending"
          onClick={() => column.toggleSorting(true)}
        >
          <ArrowDown className="text-accent mr-2" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
