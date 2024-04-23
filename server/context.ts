import { auth } from '~/utils/auth';
import * as context from 'next/headers';

export const createTRPCContext = async (opts: {
  headers: Headers;
  method?: string;
}) => {
  const authRequest = auth.handleRequest(opts.method ?? 'GET', context);
  const session = await authRequest.validate();

  return {
    session,
    headers: opts.headers,
  };
};
