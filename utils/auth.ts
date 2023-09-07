import { lucia } from 'lucia';
import { nextjs } from 'lucia/middleware';
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma as client } from '~/utils/db';
import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18

export const auth = lucia({
  env: 'DEV', // "PROD" if deployed to HTTPS
  middleware: nextjs(),
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (data) => {
    return {
      username: data.username,
    };
  },
  adapter: prismaAdapter(client),
});

export type Auth = typeof auth;
