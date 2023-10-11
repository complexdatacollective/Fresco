'use client';

import { useState, type ReactElement } from 'react';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { trpc } from '~/app/_trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '~/providers/SessionPrivider';
import type { Session } from 'lucia';
import { env } from '~/env.mjs';
import SuperJSON from 'superjson';

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
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({ url: '/api/trpc' }),
        // The unstable stream link seems to cause issues with the login process.
        // unstable_httpBatchStreamLink({
        //   url: '/api/trpc',
        //   headers() {
        //     const newHeaders = new Map(headers);
        //     newHeaders.delete('content-length');
        //     return Object.fromEntries(newHeaders);
        //   },
        // }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={true} />
        <SessionProvider session={initialSession}>{children}</SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
