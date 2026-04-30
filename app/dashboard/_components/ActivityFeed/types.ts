import { type Prisma } from '~/lib/db/generated/client';

export const activityTypes = [
  'Protocol Installed',
  'Protocol Uninstalled',
  'Participant(s) Added',
  'Participant(s) Removed',
  'Interview Started',
  'Interview Completed',
  'Interview Opened',
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
  'Recovery Codes Regenerated',
  'Passkey Registered',
  'Passkey Removed',
  'Password Removed',
  'Password Set',
  'Auth Reset',
  'Switched to Passkey Mode',
  'Switched to Password Mode',
  'Setting Changed',
  'Synthetic Data Generated',
  'Synthetic Data Deleted',
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

export const sortOrder = ['asc', 'desc', 'none'] as const;

export const sortableFields = ['timestamp', 'type', 'message'] as const;

export type SearchParams = {
  page: number;
  perPage: number;
  sort: (typeof sortOrder)[number];
  sortField: (typeof sortableFields)[number];
  q: string | null;
  type: ActivityType[] | null;
};
