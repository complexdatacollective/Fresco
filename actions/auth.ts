'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createUserFormDataSchema, loginSchema } from '~/schemas/auth';
import { auth, getServerSession } from '~/utils/auth';
import { prisma } from '~/lib/db';

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
        success: false,
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

    redirect('/setup?step=2');
  } catch (error) {
    // db error, email taken, etc
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

  // get user by userId
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

  let key;
  try {
    key = await auth.useKey('username', username, password);
  } catch (e) {
    return {
      success: false,
      formErrors: ['Incorrect username or password'],
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

  await auth.invalidateSession(session.sessionId);

  revalidatePath('/');
}
