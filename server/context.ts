import type * as trpc from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import {
  getAuth,
  type SignedInAuthObject,
  type SignedOutAuthObject,
} from '@clerk/nextjs/server';

type AuthContext = {
  auth: SignedInAuthObject | SignedOutAuthObject;
};

export const createInnerTRPCContext = ({ auth }: AuthContext) => {
  return {
    auth,
  };
};

export const createTRPCContext = (opts: trpcNext.CreateNextContextOptions) => {
  return createInnerTRPCContext({ auth: getAuth(opts.req) });
};

export type Context = trpc.inferAsyncReturnType<typeof createTRPCContext>;
