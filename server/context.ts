import type { NextRequest } from 'next/server';
import * as context from 'next/headers';
import { cache } from 'react';
import { auth } from '~/utils/auth';
import type { Session } from 'lucia';

export const getDefaultSession = cache(() => {
  const authRequest = auth.handleRequest('GET', context);

  return authRequest.validate();
});

const createInnerTRPCContext = ({
  session,
  request,
}: {
  session: Session | null;
  request: NextRequest;
}) => {
  return {
    request,
    session,
  };
};

export const createTRPCContext = async (req: NextRequest) => {
  return createInnerTRPCContext({
    request: req,
    session: await getDefaultSession(),
  });
};
