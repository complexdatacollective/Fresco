import type { Session } from 'lucia';
import { auth } from '~/utils/auth';
import * as context from 'next/headers';

type CreateContextOptions = {
  headers: Headers;
  session: Session | null;
};

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    headers: opts.headers,
  };
};

export const createTRPCContext = async (opts: { req: Request }) => {
  // Fetch stuff that depends on the request

  const authRequest = auth.handleRequest(opts.req.method, context);
  const session = await authRequest.validate();

  return createInnerTRPCContext({
    session,
    headers: opts.req.headers,
  });
};
