import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getDefaultSession } from '~/utils/auth';

export const createTRPCContext = async (opts?: FetchCreateContextFnOptions) => {
  return {
    session: await getDefaultSession(),
    headers: opts && Object.fromEntries(opts.req.headers),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
