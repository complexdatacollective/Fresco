'use server';

import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  await prisma.appSettings.updateMany({
    data: {
      allowAnonymousRecruitment: input,
    },
  });

  return input;
}
