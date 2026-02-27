import type { FilterParam } from '~/components/DataTable/types';
import { type Prisma } from '~/lib/db/generated/client';

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

export const sortableFields = ['timestamp', 'type', 'message'] as const;

export type SearchParams = {
  page: number;
  perPage: number;
  sort: (typeof sortOrder)[number];
  sortField: (typeof sortableFields)[number];
  filterParams: FilterParam[] | null;
};
