'use server';

import { prisma } from '~/utils/db';
import { hash } from 'bcrypt';
import { z } from 'zod';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
import type { SignUpData } from '../_components/SignUp';

export const handleSubmit = async (data: SignUpData) => {
  ('use server');

  const { email, password } = data;

  // check if email already exists in database
  const userExists = await safeLoader({
    outputValidation: z.object({
      id: z.string(),
      email: z.string(),
    }),
    loader: () =>
      prisma.user.findFirst({
        where: {
          email,
        },
      }),
  });

  if (userExists) {
    return 'Email is associated with an existing account. Please log in.';
  }

  // Hash the submitted password.
  const hashedPassword = await hash(password, 8);

  // create user in the database
  // eslint-disable-next-line local-rules/require-data-mapper
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
    },
  });

  return true;
};
