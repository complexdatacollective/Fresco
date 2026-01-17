import type { ReactNode } from 'react';
import { requireAppNotExpired } from '~/queries/appSettings';

// Force dynamic rendering because requireAppNotExpired queries the database
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAppNotExpired(true);
  return children;
}
