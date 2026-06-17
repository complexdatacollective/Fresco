'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import z from 'zod';
import { getServerSession } from '~/lib/auth/guards';
import { createSessionCookie, SESSION_COOKIE_NAME } from '~/lib/auth/session';
import { createTwoFactorToken, hashRecoveryCode } from '~/lib/auth/totp';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { type FormSubmissionResult } from '@codaco/fresco-ui/form/store/types';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { getInstallationId, isAppConfigured } from '~/queries/appSettings';
import { createUserSchema, loginSchema } from '~/schemas/auth';
import { getClientIp } from '~/utils/getClientIp';
import { hashPassword, verifyPassword } from '~/utils/password';
import { addEvent } from './activityFeed';

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

// Precomputed lazily once per server instance. Used to equalize login response
// time on the "no such user / passkey-only" path, preventing timing-based
// username enumeration.
let dummyPasswordHash: string | null = null;
async function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= await hashPassword('fresco-dummy-password-do-not-use');
  return dummyPasswordHash;
}

export async function signup(formData: unknown) {
  // Account creation must be impossible once the app is configured. This is
  // enforced here (not only in the setup page) because Server Actions are
  // directly-invokable endpoints reachable regardless of which page rendered.
  if (await isAppConfigured()) {
    return { success: false, error: 'Setup is already complete.' };
  }

  const data = formData as Record<string, unknown>;
  const password = data.password;

  // Passkey-only signup: password is null
  if (password === null || password === undefined) {
    const username = data.username;
    if (typeof username !== 'string' || username.length < 4) {
      return { success: false, error: 'Invalid username' };
    }

    let user;
    try {
      user = await prisma.user.create({
        data: {
          username,
          key: {
            create: {
              id: `username:${username}`,
              hashed_password: null,
            },
          },
        },
      });
    } catch {
      return { success: false, error: 'Username already taken' };
    }

    await createSessionCookie(user.id);
    return { success: true };
  }

  // Password-based signup
  const parsedFormData = createUserSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  const { username, password: validPassword } = parsedFormData.data;
  const hashedPassword = await hashPassword(validPassword);

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
    // Run a dummy verification so this path takes the same time as a wrong
    // password, preventing username enumeration via response timing.
    await verifyPassword(password, await getDummyPasswordHash());
    await recordLoginAttempt(username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const validPassword = await verifyPassword(password, key.hashed_password);

  if (!validPassword) {
    await recordLoginAttempt(username, ipAddress, false);
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

export async function recoveryCodeLogin(data: {
  username: string;
  recoveryCode: string;
}): Promise<FormSubmissionResult> {
  const ipAddress = await getClientIp();

  const rateLimitResult = await checkRateLimit(data.username, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      formErrors: ['Too many attempts. Please try again later.'],
    };
  }

  const user = await prisma.user.findUnique({
    where: { username: data.username },
    select: { id: true, username: true },
  });

  if (!user) {
    await recordLoginAttempt(data.username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Invalid username or recovery code'],
    };
  }

  const codeHash = hashRecoveryCode(data.recoveryCode);

  const { count } = await prisma.recoveryCode.updateMany({
    where: {
      user_id: user.id,
      codeHash,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (count === 0) {
    await recordLoginAttempt(data.username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Invalid username or recovery code'],
    };
  }

  await recordLoginAttempt(data.username, ipAddress, true);
  await createSessionCookie(user.id);

  void addEvent(
    'Recovery Code Used',
    `User ${user.username} logged in with a recovery code`,
  );

  return { success: true };
}

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
