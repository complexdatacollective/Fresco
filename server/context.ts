import type { NextRequest } from 'next/server';
import * as context from 'next/headers';
import { cache } from 'react';
import { auth } from '~/utils/auth';
import type { Session } from 'lucia';

export const getDefaultSession = () => {
  console.log('context', context, context.headers().get('x-trpc-source'));
  const authRequest = auth.handleRequest('GET', context);

  return authRequest.validate();
};

export const createContext = async (req: NextRequest) => {
  const session = await getDefaultSession();
  console.log('session', session);
  return {
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
