import { type Prisma } from '@prisma/client';
import * as z from 'zod';
import { numberEnum } from '~/schemas/participant';

export type Option = {
  label: string;
  value: ActivityType;
  icon?: React.ComponentType<{ className?: string }>;
};

export type DataTableFilterOption<TData> = {
  id?: string;
  label: string;
  value: keyof TData | string;
  items: Option[];
  isMulti?: boolean;
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
] as const;

export type ActivityType = (typeof activityTypes)[number];

const ActivitySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(activityTypes),
  message: z.string(),
});

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

// As above, this should be derivable from the column definition...
const searchableFields = ['message'] as const;

export const pageSizes = [10, 20, 50, 100] as const;
export type PageSize = (typeof pageSizes)[number];

export const FilterParam = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
});
export type FilterParam = z.infer<typeof FilterParam>;

const SearchParamsSchema = z.object({
  page: z.number(),
  perPage: numberEnum(pageSizes),
  sort: z.enum(sortOrder),
  sortField: z.enum(sortableFields),
  filterParams: z.array(FilterParam).nullable(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;
