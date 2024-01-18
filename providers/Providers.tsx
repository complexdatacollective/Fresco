import { type ReactElement } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TRPCReactProvider } from '~/trpc/client';
import type { Session } from 'lucia';
import { headers } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <ClerkProvider>
      <TRPCReactProvider headers={headers()}>
        <ReactQueryDevtools initialIsOpen={true} />
        {children}
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
