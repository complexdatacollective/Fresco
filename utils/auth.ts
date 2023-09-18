import { lucia } from 'lucia';
import { nextjs } from 'lucia/middleware';
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma as client } from '~/utils/db';
import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User } from '@prisma/client';
import { nextjs_future } from 'lucia/middleware';
import { env } from '~/env.mjs';

export const auth = lucia({
  env: env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
  middleware: nextjs_future(),
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (data: User) => {
    return {
      username: data.username,
    };
  },
  adapter: prismaAdapter(client),
  experimental: {
    debugMode: env.NODE_ENV !== 'production',
  },
});

export type Auth = typeof auth;

export const getPageSession = cache(() => {
  const authRequest = auth.handleRequest({
    request: null,
    cookies,
  });

  return authRequest.validate();
});

export const sessionGuard = async ({ returnPath }: { returnPath: string }) => {
  const session = await getPageSession();

  console.log('session guard', session);

  if (!session) {
    console.log('session guard: no session. redirecting.');
    redirect('/signin?returnPath=' + returnPath);
  }

  return session;
};
