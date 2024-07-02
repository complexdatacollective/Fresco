'use server';

import { hash, verify } from '@node-rs/argon2';
import { generateIdFromEntropySize } from 'lucia';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createUserFormDataSchema, loginSchema } from '~/schemas/auth';
import { auth, getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function signup(formData: unknown) {
  const parsedFormData = createUserFormDataSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  const { username, password } = parsedFormData.data;

  const hashedPassword = await hash(password);
  const userId = generateIdFromEntropySize(10); // 16 characters long

  try {
    await prisma.user.create({
      data: {
        id: userId,
        username,
        hashedPassword,
      },
    });

    const session = await auth.createSession(userId, {});
    const sessionCookie = auth.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return {
      success: true,
    };
  } catch (error) {
    // db error, username taken, etc
    return {
      success: false,
      error: 'Username already taken',
    };
  }
}

export const login = async (
  data: unknown,
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      formErrors: string[];
      fieldErrors?: Record<string, string[]>;
    }
> => {
  const parsedFormData = loginSchema.safeParse(data);

  if (!parsedFormData.success) {
    return {
      success: false,
      ...parsedFormData.error.flatten(),
    };
  }

  const { username, password } = parsedFormData.data;

  // get user by username
  const existingUser = await prisma.user.findFirst({
    where: {
      username,
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
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const validPassword = await verify(existingUser.hashedPassword, password);
  if (!validPassword) {
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
    };
  }

  const session = await auth.createSession(existingUser.id, {});
  const sessionCookie = auth.createSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return {
    success: true,
  };
};

export async function logout() {
  const { session } = await getServerSession();
  if (!session) {
    return {
      error: 'Unauthorized',
    };
  }

  await auth.invalidateSession(session.id);

  const sessionCookie = auth.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  revalidatePath('/');
}
