'use server';

import { loggerLink } from '@trpc/client';
import { experimental_nextCacheLink } from '@trpc/next/app-dir/links/nextCache';
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server';
import { cookies } from 'next/headers';
import { env } from '~/env.mjs';
import { type AppRouter, appRouter } from '~/server/router';
import { getDefaultSession } from '~/utils/auth';

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const trpcRscHTTP = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        experimental_nextCacheLink({
          revalidate: false,
          router: appRouter,
          createContext: async () => {
            console.log('rsc create context');
            return {
              session: await getDefaultSession(),
              headers: {
                'cookie': cookies().toString(),
                'x-trpc-source': 'rsc-invoke',
              },
            };
          },
        }),
      ],
    };
  },
});
