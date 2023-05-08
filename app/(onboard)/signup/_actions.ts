"use server"

import { prisma } from "~/utils/db";
import { hash } from 'bcrypt';


export const handleSubmit = async (data: FormData) => {
  "use server";

  // Data is an object containing the submitted form data.
  console.log('data', data);

  // Hash the submitted password.
  const password = await hash(data.get('password'), 8);

  // check if email already exists in database
  const isEmailInDb = await prisma.user.findUnique({
    where: {
      email: data.get('email'),
    }
  });

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
        connect: [{
          id: '1',
        }],
      },
    },
  })

  return true;
};

export const verifyRole = async (email: string) => {
  "use server"

  // lookup user by email in database
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
    }
  });

  if (!user || !user.roles) {
    return false;
  }

  // check if user has role of participant
  if (user.roles.some(e => e.name === 'PARTICIPANT')) {
    console.log('user is a participant');
    return false;
  }
  
  return true;
};