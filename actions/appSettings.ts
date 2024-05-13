'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  await requireApiAuth();

  await prisma.appSettings.updateMany({
    data: {
      allowAnonymousRecruitment: input,
    },
  });

  revalidateTag('allowAnonymousRecruitment');

  return input;
}

export async function setLimitInterviews(input: boolean) {
  await requireApiAuth();
  await prisma.appSettings.updateMany({
    data: {
      limitInterviews: input,
    },
  });

  revalidateTag('limitInterviews');

  return input;
}

export const setAppConfigured = async () => {
  await requireApiAuth();

  try {
    await prisma.appSettings.updateMany({
      data: {
        configured: true,
      },
    });

    revalidateTag('appSettings');
  } catch (error) {
    return { error: 'Failed to update appSettings', appSettings: null };
  }

  redirect('/dashboard');
};
