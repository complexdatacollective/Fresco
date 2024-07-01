/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { type User } from '@prisma/client';
import { Lucia } from 'lucia';
// import 'lucia/polyfill/node'; // polyfill for Node.js versions <= 18
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';
import { env } from '~/env';
import { prisma } from '~/utils/db';

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const auth = new Lucia(adapter, {
  getUserAttributes: (data: User) => {
    return {
      username: data.username,
    };
  },
  sessionCookie: {
    name: 'fresco-session',
    // this sets cookies with super long expiration
    // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      secure: env.NODE_ENV === 'production',
    },
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof auth;
    // DatabaseSessionAttributes: DatabaseSessionAttributes;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  hashedPassword: string;
}

export const getServerSession = cache(async () => {
  const sessionId = cookies().get(auth.sessionCookieName)?.value ?? null;
  if (!sessionId)
    return {
      session: null,
      user: null,
    };
  const result = await auth.validateSession(sessionId);
  try {
    if (result.session?.fresh) {
      const sessionCookie = auth.createSessionCookie(result.session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!result.session) {
      const sessionCookie = auth.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
  } catch {
    // Next.js throws error when attempting to set cookies when rendering page
  }
  return result;
});

export type Auth = typeof auth;

export async function requirePageAuth({
  redirectPath,
}: {
  redirectPath?: string | null;
} = {}) {
  const { session } = await getServerSession();

  if (!session) {
    if (!redirectPath) {
      redirect('/signin');
    }

    redirect('/signin?callbackUrl=' + encodeURIComponent(redirectPath));
  }
  return session;
}

export async function requireApiAuth() {
  const { session } = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
