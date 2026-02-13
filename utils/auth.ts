import { cookies } from 'next/headers';
import { RedirectType, redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';
import { prisma } from '~/lib/db';

const SESSION_COOKIE_NAME = 'auth_session';

export const getServerSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.idle_expires < BigInt(Date.now())) {
    // Session already expired; delete is best-effort (may already be removed)
    await prisma.session
      .delete({ where: { id: sessionId } })
      .catch((_error: unknown) => undefined);
    return null;
  }

  return {
    sessionId: session.id,
    user: {
      userId: session.user_id,
      username: session.user.username,
    },
  };
});

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
