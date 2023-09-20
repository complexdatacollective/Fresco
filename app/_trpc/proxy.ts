import { createTRPCProxyClient, httpBatchLink } from '@trpc/react-query';
import { type AppRouter } from '~/server/router';

export const proxy = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});
