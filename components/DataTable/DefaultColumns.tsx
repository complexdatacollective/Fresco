import { type ColumnDef } from '@tanstack/react-table';

export const makeDefaultColumns = <TData, TValue>(
  data: TData[],
): ColumnDef<TData, TValue>[] => {
  const firstRow = data[0];

  if (!firstRow || typeof firstRow !== 'object') {
    throw new Error('Data must be an array of objects.');
  }

  const columnKeys = Object.keys(firstRow);

  const columns: ColumnDef<TData, TValue>[] = columnKeys.map((key) => {
    return {
      accessorKey: key,
      header: key,
    };
  });

  return columns;
};
