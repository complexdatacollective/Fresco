import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { env } from '~/env.mjs';
import { appRouter } from '~/server/router';
import { createTRPCContext } from '~/server/context';
import { trackEvent } from '~/analytics/utils';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    onError(opts) {
      const { error, type, path } = opts;

      void trackEvent({
        type: 'Error',
        name: error.name,
        message: error.message,
        stack: error.stack,
        metadata: {
          code: error.code,
          path,
          type,
        },
      });

      if (env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
  });

export { handler as GET, handler as POST };
