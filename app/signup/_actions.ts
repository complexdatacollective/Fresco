"use server"

import { prisma } from "~/server/db";
import { hash } from 'bcrypt';

export const handleSubmit = async (data: FormData) => {
  "use server";

  // Data is an object containing the submitted form data.
  console.log('data', data);

  // Hash the password.
  const password = await hash(data.get('password'), 8);

  // This is where we would create the user in the database, or reject with
  // validation stuff.
  await prisma.user.upsert({
    where: { email: data.get('email') },
    update: {},
    create: {
      name: data.get('name'),
      email: data.get('email'),
      password,
      roles: {
        connect: [{
          id: '1',
      }],
      },
    },
  })

  return true;
};