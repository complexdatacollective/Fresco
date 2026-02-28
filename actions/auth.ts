'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import z from 'zod';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { createSessionCookie } from '~/lib/session';
import { createTwoFactorToken } from '~/lib/totp';
import { getInstallationId } from '~/queries/appSettings';
import { createUserFormDataSchema, loginSchema } from '~/schemas/auth';
import { getServerSession } from '~/utils/auth';
import { getClientIp } from '~/utils/getClientIp';
import { hashPassword, verifyPassword } from '~/utils/password';
import { addEvent } from './activityFeed';

const SESSION_COOKIE_NAME = 'auth_session';

type RateLimited = {
  success: false;
  rateLimited: true;
  retryAfter: number;
};

type TwoFactorRequired = {
  success: false;
  requiresTwoFactor: true;
  twoFactorToken: string;
};

export type LoginResult =
  | FormSubmissionResult
  | RateLimited
  | TwoFactorRequired;

export async function signup(formData: unknown) {
  const parsedFormData = createUserFormDataSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  const { username, password } = parsedFormData.data;
  const hashedPassword = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
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
  } catch {
    return {
      success: false,
      error: 'Username already taken',
    };
  }

  await createSessionCookie(user.id);

  redirect('/setup?step=2');
}

export const login = async (data: unknown): Promise<LoginResult> => {
  const parsedFormData = loginSchema.safeParse(data);

  if (!parsedFormData.success) {
    return {
      success: false,
      ...z.flattenError(parsedFormData.error),
    };
  }

  const { username, password } = parsedFormData.data;
  const ipAddress = await getClientIp();

  const rateLimitResult = await checkRateLimit(username, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      rateLimited: true,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  const key = await prisma.key.findUnique({
    where: { id: `username:${username}` },
  });

  if (!key?.hashed_password) {
    void recordLoginAttempt(username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const validPassword = await verifyPassword(password, key.hashed_password);

  if (!validPassword) {
    void recordLoginAttempt(username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  await recordLoginAttempt(username, ipAddress, true);

  const totpCredential = await prisma.totpCredential.findFirst({
    where: { user_id: key.user_id, verified: true },
  });

  if (totpCredential) {
    const installationId = await getInstallationId();
    if (!installationId) {
      return {
        success: false,
        formErrors: ['Server configuration error. Please contact an admin.'],
      };
    }
    const twoFactorToken = createTwoFactorToken(key.user_id, installationId);
    return {
      success: false,
      requiresTwoFactor: true,
      twoFactorToken,
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

  await prisma.session
    .delete({ where: { id: session.sessionId } })
    .catch((_error: unknown) => undefined);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  revalidatePath('/');
}
