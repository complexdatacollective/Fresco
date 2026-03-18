import type { RowData } from '@tanstack/react-table';
import type { FilterConfig } from '~/components/DataTable/filters/types';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterType?: 'range' | 'date' | 'boolean' | 'faceted' | 'operator';
    filterConfig?: FilterConfig;
    className?: string;
  }
}
