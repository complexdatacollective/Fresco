import {
  createTRPCProxyClient,
  unstable_httpBatchStreamLink,
} from '@trpc/react-query';
import { type AppRouter } from '~/server/router';
import { getUrl } from '~/utils/getURL';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    unstable_httpBatchStreamLink({
      url: getUrl(),
    }),
  ],
});
