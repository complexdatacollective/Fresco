import 'server-only';

import { createId } from '@paralleldrive/cuid2';
import { cookies } from 'next/headers';
import { env } from '~/env';
import { prisma } from '~/lib/db';

const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_ACTIVE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24 hours
const SESSION_IDLE_PERIOD_MS = 1000 * 60 * 60 * 24 * 14; // 2 weeks

export async function createSessionCookie(userId: string) {
  const sessionId = createId();
  const now = Date.now();

  await prisma.session.create({
    data: {
      id: sessionId,
      user_id: userId,
      active_expires: BigInt(now + SESSION_ACTIVE_PERIOD_MS),
      idle_expires: BigInt(now + SESSION_IDLE_PERIOD_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_IDLE_PERIOD_MS / 1000,
  });
}
