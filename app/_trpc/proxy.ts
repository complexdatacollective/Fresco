import { createTRPCProxyClient, httpBatchLink } from '@trpc/react-query';
import { type AppRouter } from '~/server/router';
import { getBaseUrl } from '~/utils/trpc';

export const proxy = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
