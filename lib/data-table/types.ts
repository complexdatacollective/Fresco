import { type Prisma } from '@prisma/client';
import * as z from 'zod';
import { numberEnum } from '~/shared/schemas/schemas';

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

export const ActivitySchema = z.object({
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

export type Result = {
  data: Activity[];
  pageCount: number;
};

export const sortOrder = ['asc', 'desc'] as const;
export type SortOrder = (typeof sortOrder)[number]; // 'asc' | 'desc'

export const sortableFields = [
  // Todo: couldn't work out a way to derive this from the Db schema
  'timestamp',
  'type',
  'message',
] as const;

export type SortableField = (typeof sortableFields)[number];

export const pageSizes = [10, 20, 50, 100] as const;
export type PageSize = (typeof pageSizes)[number];

export const SearchParamsSchema = z.object({
  page: z.number(),
  perPage: numberEnum(pageSizes),
  sort: z.enum(sortOrder),
  sortField: z.enum(sortableFields),
  type: z.enum(activityTypes).nullable(),
  message: z.string().nullable(),
});
