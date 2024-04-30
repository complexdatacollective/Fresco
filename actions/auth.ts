'use server';

import { parseWithZod } from '@conform-to/zod';
import { prisma } from '~/utils/db';
import { cookies } from 'next/headers';
import { Argon2id } from 'oslo/password';
import { getServerSession, lucia } from '~/utils/auth';
import { redirect } from 'next/navigation';
import { generateIdFromEntropySize } from 'lucia';
import { loginSchema } from '~/schemas/auth';

export async function signup(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const hashedPassword = await new Argon2id().hash(password);
  const userId = generateIdFromEntropySize(10); // 16 characters long

  try {
    await prisma.user.create({
      data: {
        id: userId,
        username,
        hashedPassword,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

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
    return {
      error: 'Incorrect username or password',
    };
  }

  const validPassword = await new Argon2id().verify(
    existingUser.hashedPassword,
    submission.value.password,
  );
  if (!validPassword) {
    return {
      error: 'Incorrect username or password',
    };
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return redirect('/dashboard');
}

export async function logout() {
  const { session } = await getServerSession();
  if (!session) {
    return {
      error: 'Unauthorized',
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect('/');
}
