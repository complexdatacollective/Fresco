'use server';

import { prisma } from '~/utils/db';

export async function setLimitInterviews(input: boolean) {
  const result = await prisma.appSettings.updateMany({
    data: {
      limitInterviews: input,
    },
  });

  return result;
}
