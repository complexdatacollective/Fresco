'use server';

import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from '@trpc/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server';
import { headers } from 'next/headers';
import SuperJSON from 'superjson';
import { env } from '~/env.mjs';
import { type AppRouter } from '~/server/router';
import { getUrl } from '~/trpc/shared';

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const api = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        // This link doesn't allow revalidate: 0, which is needed to disable caching
        // entirely. It is also not considered production ready: https://nextjs.org/docs/app/building-your-application/caching#unstable_cache
        // experimental_nextCacheLink({
        //   revalidate: 1,
        //   router: appRouter,
        //   createContext: async () => ({
        //     session: await getPageSession(),
        //     headers: {
        //       'cookie': cookies().toString(),
        //       'x-trpc-source': 'rsc-invoke',
        //     },
        //   }),
        // }),
        experimental_nextHttpLink({
          batch: true,
          headers() {
            const heads = new Map(headers());
            heads.set('x-trpc-source', 'rsc-invoke');
            return Object.fromEntries(heads);
          },
          url: getUrl(),
        }),
      ],
    };
  },
});

export const api2 = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    loggerLink({
      enabled: (op) =>
        env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      headers() {
        const heads = new Map(headers());
        heads.set('x-trpc-source', 'rsc');
        return Object.fromEntries(heads);
      },
    }),
  ],
});
