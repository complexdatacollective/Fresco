import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/router';
import { createContext } from '~/server/context';
import { NextRequest } from 'next/server';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => await createContext(req),
    // createContext: async () =>
    //   await createContext({ req, resHeaders: res.headers }),
  });

export { handler as GET, handler as POST };
