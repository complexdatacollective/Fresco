'use client';

import { useState, type ReactElement } from 'react';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { trpc } from '~/app/_trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === 'development' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({ url: '/api/trpc' }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
