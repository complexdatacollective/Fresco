import { type ReactElement } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TRPCReactProvider } from '~/trpc/client';
import { SessionProvider } from '~/providers/SessionProvider';
import type { Session } from 'lucia';
import { headers } from 'next/headers';

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}): ReactElement {
  return (
    <TRPCReactProvider headers={headers()}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SessionProvider session={initialSession}>{children}</SessionProvider>
    </TRPCReactProvider>
  );
}
