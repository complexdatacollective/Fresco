import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { env } from '~/env.mjs';
import { appRouter } from '~/server/router';
import { createTRPCContext } from '~/server/context';
import type { NextApiRequest, NextApiResponse } from 'next';
import { trackEvent } from '~/analytics/utils';

const handler = (req: NextApiRequest, res: NextApiResponse) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, res }),
    onError(opts) {
      const { error, type, path } = opts;

      void trackEvent({
        type: 'Error',
        error: {
          message: error.message,
          details: type,
          path: path ?? 'unknown',
          stacktrace: 'unknown',
        },
      });

      if (env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
  });

export { handler as GET, handler as POST };
