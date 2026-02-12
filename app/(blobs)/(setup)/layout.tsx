import { Loader2 } from 'lucide-react';
import { connection } from 'next/server';
import { type ReactNode, Suspense } from 'react';
import { requireAppNotExpired } from '~/queries/appSettings';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<Loader2 className="text-background size-10 animate-spin" />}
    >
      <SetupLayoutContent>{children}</SetupLayoutContent>
    </Suspense>
  );
}

async function SetupLayoutContent({ children }: { children: ReactNode }) {
  await connection();
  await requireAppNotExpired(true);
  return children;
}
