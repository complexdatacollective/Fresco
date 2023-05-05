"use server"

import { prisma } from "~/server/db";

export const handleSubmit = async (data: FormData) => {
  "use server";

  // Data is an object containing the submitted form data.
  console.log(data);

  // This is where we would create the user in the database, or reject with
  // validation stuff.
  const users = await prisma.user.findMany();

  return true;
};