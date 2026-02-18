import * as React from 'react';
import { cx } from '~/utils/cva';
import Surface from '../layout/Surface';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    surfaceProps?: React.ComponentProps<typeof Surface>;
  }
>(({ className, surfaceProps, ...props }, ref) => (
  <Surface
    maxWidth="none"
    spacing="none"
    {...surfaceProps}
    className={cx(
      'mx-auto w-full max-w-full overflow-x-auto rounded border',
      surfaceProps?.className,
    )}
    noContainer
  >
    <div className="w-full max-w-full overflow-x-auto">
      <table
        ref={ref}
        className={cx('w-full caption-bottom border-collapse', className)}
        {...props}
      />
    </div>
  </Surface>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cx(
      'publish-colors border-collapse bg-[color-mix(in_oklab,var(--surface)_90%,var(--primary))] [&_tr]:border-b',
      className,
    )}
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
    className={cx(
      '[&_tr:last-child]:border-0',
      '[&_tr:not(:only-child)]:hover:bg-current/3', // Hover effect only on body rows, disabled when empty (single row)
      className,
    )}
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
    className={cx(
      'bg-primary publish-colors text-primary-contrast font-medium',
      className,
    )}
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
    className={cx(
      'h-14', // Height works the same as min-h for table rows https://stackoverflow.com/questions/19432092/can-i-use-a-min-height-for-table-tr-or-td
      'data-[state=selected]:bg-selected/15 border-b outline-current/20 transition-colors duration-300',
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
    className={cx(
      'px-6 whitespace-nowrap',
      'text-left font-medium first:pl-12 last:pr-12',
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
    className={cx(
      'px-6 align-middle whitespace-nowrap',
      'first:pl-12 last:pr-12',
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
    className={cx('mt-4 text-sm text-current/70', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
