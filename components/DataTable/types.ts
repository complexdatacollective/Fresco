import * as z from 'zod';
import { type Prisma } from '~/lib/db/generated/client';

export type Option = {
  label: string;
  value: ActivityType;
  icon?: React.ComponentType<{ className?: string }>;
};

export type DataTableSearchableColumn<TData> = {
  id: keyof TData;
  title: string;
};

export type DataTableFilterableColumn<TData> = {
  options: Option[];
} & DataTableSearchableColumn<TData>;

// TODO: move activity table specific types to a separate file

export const activityTypes = [
  'Protocol Installed',
  'Protocol Uninstalled',
  'Participant(s) Added',
  'Participant(s) Removed',
  'Interview Started',
  'Interview Completed',
  'Interview(s) Deleted',
  'Data Exported',
  'API Token Created',
  'API Token Updated',
  'API Token Deleted',
  'Preview Mode',
  'User Login',
  'User Created',
  'User Deleted',
  'Password Changed',
  'Two-Factor Enabled',
  'Two-Factor Disabled',
  'Two-Factor Reset',
  'Two-Factor Login',
  'Recovery Code Used',
  'Recovery Codes Regenerated',
] as const;

export type ActivityType = (typeof activityTypes)[number];

export type Activity = Prisma.EventsGetPayload<{
  select: {
    id: true;
    timestamp: true;
    type: true;
    message: true;
  };
}>;

export const sortOrder = ['asc', 'desc'] as const;

export const sortableFields = [
  // Todo: couldn't work out a way to derive this from the Db schema
  // Also, shouldn't this be derivable from the column definition?
  'timestamp',
  'type',
  'message',
] as const;
export type SortableField = (typeof sortableFields)[number];

export const pageSizes = [10, 20, 50, 100] as const;

export const FilterParam = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
});
export type FilterParam = z.infer<typeof FilterParam>;

export type SearchParams = {
  page: number;
  perPage: number;
  sort: (typeof sortOrder)[number];
  sortField: (typeof sortableFields)[number];
  filterParams: FilterParam[] | null;
};
