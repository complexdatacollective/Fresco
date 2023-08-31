'use server';

import { prisma } from '~/utils/db';
import { hash } from 'bcrypt';
import { z } from 'zod';
import { safeLoader } from '~/lib/data-mapper/safeLoader';

export const handleSubmit = async (data: FormData) => {
  'use server';

  // Data is an object containing the submitted form data.
  console.log('data', data);

  // Hash the submitted password.
  const password = await hash(data.get('password'), 8);

  // check if email already exists in database

  const UserValidation = z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
  );

  const safeLoadUsers = safeLoader({
    outputValidation: UserValidation,
    loader: async function loadUsers() {
      const users = await prisma.user.findMany({
        where: {
          email: data.get('email'),
        },
      });
      return users;
    },
  });

  const isEmailInDb = await safeLoadUsers();

  if (isEmailInDb) {
    console.log('email is not unique');
    return 'Email is associated with an existing account. Please log in.';
  }

  // create user in the database
  await prisma.user.upsert({
    where: { email: data.get('email') },
    update: {},
    create: {
      name: data.get('name'),
      email: data.get('email'),
      password,
      roles: {
        connect: [
          {
            id: '1',
          },
        ],
      },
    },
  });

  return true;
};
