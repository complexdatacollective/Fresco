'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  console.log('setAnonymousRecruitment', input);
  const result = await prisma.appSettings.updateMany({
    data: {
      allowAnonymousRecruitment: input,
    },
  });

  if (result.count === 0) {
    console.log(
      'setAnonymousRecruitment: settings not updated!',
      result,
      !input,
    );
    return !input;
  }

  revalidateTag('anonymousRecruitmentStatus');

  return input;
}
