'use server';

import { parseWithZod } from '@conform-to/zod';
import { getServerSession, auth } from '~/utils/auth';
import { redirect } from 'next/navigation';
import { loginSchema } from '~/schemas/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '~/utils/db';

export async function signup(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const user = await auth.createUser({
      key: {
        providerId: 'username', // auth method
        providerUserId: username, // unique id when using "username" auth method
        password, // hashed by Lucia
      },
      attributes: {
        username,
      },
    });

    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });

    if (!session) {
      return {
        error: 'Failed to create session',
      };
    }

    // set session cookie

    const sessionCookie = auth.createSessionCookie(session);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // eslint-disable-next-line no-console
    console.log('signup success');

    return;
  } catch (error) {
    // db error, email taken, etc
    return {
      error: 'Username already taken',
    };
  }
}

export async function login(formData: FormData) {
  const submission = parseWithZod(formData, {
    schema: loginSchema,
  });

  // Validate
  if (submission.status !== 'success') {
    return {
      error: 'Invalid form submission',
    };
  }

  // get user by userId

  const existingUser = await prisma.user.findFirst({
    where: {
      username: submission.value.username.toLowerCase(),
    },
  });

  if (!existingUser) {
    // NOTE:
    // Returning immediately allows malicious actors to figure out valid usernames from response times,
    // allowing them to only focus on guessing passwords in brute-force attacks.
    // As a preventive measure, you may want to hash passwords even for invalid usernames.
    // However, valid usernames can be already be revealed with the signup page among other methods.
    // It will also be much more resource intensive.
    // Since protecting against this is non-trivial,
    // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
    // If usernames are public, you may outright tell the user that the username is invalid.
    // eslint-disable-next-line no-console
    console.log('invalid username');
    return {
      error: 'Incorrect username or password',
    };
  }

  const key = await auth.useKey(
    'username',
    submission.value.username,
    submission.value.password,
  );

  if (!key) {
    return {
      error: 'Invalid username or password',
    };
  }

  const session = await auth.createSession({
    userId: key.userId,
    attributes: {},
  });

  const sessionCookie = auth.createSessionCookie(session);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return redirect('/dashboard');
}

export async function logout() {
  const session = await getServerSession();
  if (!session) {
    return {
      error: 'Unauthorized',
    };
  }

  await auth.invalidateSession(session.sessionId);

  revalidatePath('/');
}
