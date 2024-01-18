'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { type AppRouter } from '~/server/router';
import { getUrl } from './shared';
import SuperJSON from 'superjson';
import { env } from '~/env.mjs';

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  headers: Headers;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchLink({
          url: getUrl(),
          // I needed to add the headers here, otherwise the session wasn't
          // available during SSR. This caused an issue with useSuspenseQuery
          headers() {
            const heads = new Map(props.headers);
            heads.set('x-trpc-source', 'react');
            return Object.fromEntries(heads);
          },
        }),
        // This is the link used in create-t3-app, but it doesn't set the session cookie for some reason.
        // unstable_httpBatchStreamLink({
        //   url: getUrl(),
        //   headers() {
        //     const heads = new Map(props.headers);
        //     heads.set('x-trpc-source', 'react');
        //     return Object.fromEntries(heads);
        //   },
        // }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
