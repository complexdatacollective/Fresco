'use server';

import { redirect } from 'next/navigation';
import { safeRevalidateTag } from '~/lib/cache';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  await requireApiAuth();

  await prisma.appSettings.updateMany({
    data: {
      allowAnonymousRecruitment: input,
    },
  });

  safeRevalidateTag('allowAnonymousRecruitment');

  return input;
}

export async function setLimitInterviews(input: boolean) {
  await requireApiAuth();
  await prisma.appSettings.updateMany({
    data: {
      limitInterviews: input,
    },
  });

  safeRevalidateTag('limitInterviews');

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

    safeRevalidateTag('appSettings');
  } catch (error) {
    return { error: 'Failed to update appSettings', appSettings: null };
  }

  redirect('/dashboard');
};
