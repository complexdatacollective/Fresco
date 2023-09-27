import { loggerLink } from '@trpc/client';
import {
  experimental_createActionHook,
  experimental_createTRPCNextAppDirClient,
  experimental_serverActionLink,
} from '@trpc/next/app-dir/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import { env } from '~/env.mjs';
import type { AppRouter } from '~/server/router';
import { getBaseUrl } from '~/utils/trpc';

export const trpc = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            (env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        experimental_nextHttpLink({
          batch: true,
          url: getBaseUrl(),
          headers() {
            return {
              'x-trpc-source': 'client',
            };
          },
        }),
      ],
    };
  },
});

export const useAction = experimental_createActionHook({
  links: [loggerLink(), experimental_serverActionLink()],
});
