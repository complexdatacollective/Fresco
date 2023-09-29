'use server';

import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from '@trpc/client';
import { headers } from 'next/headers';
import { env } from '~/env.mjs';
import { type AppRouter } from '~/server/router';
import { getUrl } from '~/utils/trpc';

export const trpcRscProxy = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      headers() {
        const newHeaders = new Map(headers());
        newHeaders.set('x-trpc-source', 'rsc-proxy');
        newHeaders.delete('connection');
        newHeaders.delete('transfer-encoding');
        newHeaders.delete('content-length');
        return Object.fromEntries(newHeaders);
      },
    }),
  ],
});
