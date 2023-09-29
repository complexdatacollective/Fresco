'use client';

import { useState, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '~/contexts/SessionProvider';
import type { Session } from 'lucia';
import { trpcReact } from '../app/_trpc/client';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import {
  httpBatchLink,
  loggerLink,
  unstable_httpBatchStreamLink,
} from '@trpc/client';
import { env } from '~/env.mjs';
import { getUrl } from '~/utils/trpc';

export default function Providers({
  children,
  initialSession,
  headers,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
  headers: Headers;
}): ReactElement {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: getUrl(),
          // headers() {
          //   const newHeaders = new Map(headers);
          //   newHeaders.set('x-trpc-source', 'client');
          //   return Object.fromEntries(newHeaders);
          // },
        }),
      ],
    }),
  );

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={initialSession}>{children}</SessionProvider>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}
