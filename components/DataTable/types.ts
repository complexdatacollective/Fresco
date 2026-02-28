import * as z from 'zod';

export type Option = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type DataTableSearchableColumn<TData> = {
  id: keyof TData | (string & {});
  title: string;
};

export type DataTableFilterableColumn<TData> = {
  options: Option[];
} & DataTableSearchableColumn<TData>;

export const pageSizes = [10, 20, 50, 100] as const;

export const FilterParam = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
});
export type FilterParam = z.infer<typeof FilterParam>;
