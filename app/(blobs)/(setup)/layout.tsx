import type { ReactNode } from 'react';
import { requireAppNotExpired } from '~/queries/appSettings';

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAppNotExpired(true);
  return children;
}
