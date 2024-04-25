'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  const result = await prisma.appSettings.updateMany({
    data: {
      allowAnonymousRecruitment: input,
    },
  });

  if (result.count === 0) {
    return !input;
  }

  revalidateTag('allowAnonymousRecruitment');

  return input;
}

export async function setLimitInterviews(input: boolean) {
  await prisma.appSettings.updateMany({
    data: {
      limitInterviews: input,
    },
  });

  revalidateTag('limitInterviews');

  return input;
}
