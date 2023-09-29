'use client';

import { useState, type ReactElement } from 'react';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { trpc } from '~/app/_trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '~/providers/SessionPrivider';
import type { Session } from 'lucia';
import { env } from '~/env.mjs';

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}): ReactElement {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({ url: '/api/trpc' }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={initialSession}>{children}</SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
