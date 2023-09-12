import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';
import { appRouter } from '~/server';
import { createTRPCContext } from '~/server/context';

const handler = (request: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
  });

export { handler as GET, handler as POST };
