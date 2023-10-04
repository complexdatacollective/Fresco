import { lucia } from 'lucia';
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma as client } from '~/utils/db';
import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18
import * as context from 'next/headers';
import { nextjs_future } from 'lucia/middleware';
import { env } from '~/env.mjs';
import type { User } from '@prisma/client';

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
  // experimental: {
  //   debugMode: env.NODE_ENV !== 'production',
  // },
});

export type Auth = typeof auth;

export const getPageSession = () => {
  const authRequest = auth.handleRequest('GET', context);

  return authRequest.validate();
};
