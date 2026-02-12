'use server';

import { createId } from '@paralleldrive/cuid2';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';
import z from 'zod';
import { prisma } from '~/lib/db';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { createUserFormDataSchema, loginSchema } from '~/schemas/auth';
import { hashPassword, verifyPassword } from '~/utils/password';
import { getServerSession } from '~/utils/auth';
import { safeUpdateTag } from '~/lib/cache';
import { env } from '~/env';
import { addEvent } from './activityFeed';

const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_ACTIVE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24 hours
const SESSION_IDLE_PERIOD_MS = 1000 * 60 * 60 * 24 * 14; // 2 weeks

async function createSessionCookie(userId: string) {
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
  });
}

export async function signup(formData: unknown) {
  const parsedFormData = createUserFormDataSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  try {
    const { username, password } = parsedFormData.data;
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        key: {
          create: {
            id: `username:${username}`,
            hashed_password: hashedPassword,
          },
        },
      },
    });

    await createSessionCookie(user.id);

    redirect('/setup?step=2');
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      error: 'Username already taken',
    };
  }
}

export const login = async (data: unknown): Promise<FormSubmissionResult> => {
  const parsedFormData = loginSchema.safeParse(data);

  if (!parsedFormData.success) {
    return {
      success: false,
      ...z.flattenError(parsedFormData.error),
    };
  }

  const { username, password } = parsedFormData.data;

  const existingUser = await prisma.user.findFirst({
    where: { username },
  });

  if (!existingUser) {
    // eslint-disable-next-line no-console
    console.log('invalid username');
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const key = await prisma.key.findUnique({
    where: { id: `username:${username}` },
  });

  if (!key?.hashed_password) {
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const validPassword = await verifyPassword(password, key.hashed_password);

  if (!validPassword) {
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  await createSessionCookie(key.user_id);

  void addEvent('User Login', `User ${username} logged in`);
  safeUpdateTag('activityFeed');

  return {
    success: true,
  };
};

export async function logout() {
  const session = await getServerSession();
  if (!session) {
    return {
      error: 'Unauthorized',
    };
  }

  await prisma.session.delete({ where: { id: session.sessionId } });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  revalidatePath('/');
}
