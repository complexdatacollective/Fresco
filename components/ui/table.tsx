import * as React from 'react';
import { cn } from '~/utils/shadcn';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="max-w-full overflow-x-auto rounded-md border">
    <table
      ref={ref}
      className={cn('w-full caption-bottom border-collapse text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('border-collapse [&_tr]:border-b', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-primary text-primary-foreground font-medium', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'text-muted-foreground px-4 py-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('text-muted-foreground mt-4 text-sm', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
