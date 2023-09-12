import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { auth } from '~/utils/auth';
import type { Session } from 'lucia';

export const getDefaultSession = cache((req: NextRequest) => {
  const authRequest = auth.handleRequest({
    request: req,
    cookies,
  });

  return authRequest.validate();
});

const createInnerTRPCContext = ({ session }: { session: Session | null }) => {
  return {
    session,
  };
};

export const createTRPCContext = async (req: NextRequest) => {
  return createInnerTRPCContext({
    session: await getDefaultSession(req),
  });
};
