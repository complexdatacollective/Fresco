'use server';

import { loggerLink } from '@trpc/client';
import { experimental_nextCacheLink } from '@trpc/next/app-dir/links/nextCache';
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server';
import { cookies } from 'next/headers';
import { type AppRouter, appRouter } from '~/server/router';
import { getPageSession } from '~/utils/auth';

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const api = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === 'development' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        experimental_nextCacheLink({
          // requests are cached for 5 seconds
          revalidate: 0.1,
          router: appRouter,
          createContext: async () => ({
            session: await getPageSession(),
            headers: {
              'cookie': cookies().toString(),
              'x-trpc-source': 'rsc-invoke',
            },
          }),
        }),
      ],
    };
  },
});
