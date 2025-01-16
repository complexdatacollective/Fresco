'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createUserFormDataSchema, loginSchema } from '~/schemas/auth';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

// eslint-disable-next-line @typescript-eslint/require-await
export async function signup(formData: unknown) {
  const parsedFormData = createUserFormDataSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  try {
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

  const { username } = parsedFormData.data;

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

  revalidatePath('/');
}
