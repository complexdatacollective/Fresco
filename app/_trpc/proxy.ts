import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from '@trpc/client';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { type AppRouter } from '~/server/router';
import { headers } from 'next/headers';
import { getUrl } from '~/utils/getURL';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink(),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      headers() {
        const newHeaders = new Map(headers());
        newHeaders.delete('content-length');
        return Object.fromEntries(newHeaders);
      },
    }),
  ],
});

export const helpers = createServerSideHelpers({
  client: trpc,
});
