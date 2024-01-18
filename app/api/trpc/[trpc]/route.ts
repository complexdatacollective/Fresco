import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { env } from '~/env.mjs';
import { appRouter } from '~/server/router';
import { createTRPCContext } from '~/server/context';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = (req: NextApiRequest, res: NextApiResponse) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, res }),
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            // eslint-disable-next-line no-console
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
