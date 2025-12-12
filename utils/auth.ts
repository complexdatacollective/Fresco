import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import type { User } from '~/lib/db/generated/prisma/client';
import { lucia } from 'lucia';
import { nextjs_future } from 'lucia/middleware';
import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18
import * as context from 'next/headers';
import { RedirectType, redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';
import { env } from '~/env';
import { prisma as client } from '~/utils/db';

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
});

export const getServerSession = cache(() => {
  const authRequest = auth.handleRequest('GET', context);
  return authRequest.validate();
});

export type Auth = typeof auth;

export async function requirePageAuth() {
  const session = await getServerSession();

  if (!session) {
    redirect('/signin', RedirectType.replace);
  }
  return session;
}

export async function requireApiAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
