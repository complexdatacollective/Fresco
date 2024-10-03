'use server';

import { redirect } from 'next/navigation';
import { safeRevalidateTag } from '~/lib/cache';
import { createEnvironmentFormSchema } from '~/schemas/environment';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function setAnonymousRecruitment(input: boolean) {
  await requireApiAuth();

  await prisma.appSettings.update({
    where: { key: 'allowAnonymousRecruitment' },
    data: { value: input.toString() },
  });

  safeRevalidateTag('allowAnonymousRecruitment');

  return input;
}

export async function setLimitInterviews(input: boolean) {
  await requireApiAuth();

  await prisma.appSettings.update({
    where: { key: 'limitInterviews' },
    data: { value: input.toString() },
  });

  safeRevalidateTag('limitInterviews');

  return input;
}

export const setAppConfigured = async () => {
  await requireApiAuth();

  try {
    await prisma.appSettings.update({
      where: { key: 'configured' },
      data: { value: 'true' },
    });

    safeRevalidateTag('appSettings');
  } catch (error) {
    return { error: 'Failed to update appSettings', appSettings: null };
  }

  redirect('/dashboard');
};

export async function storeEnvironment(formData: unknown) {
  const parsedFormData = createEnvironmentFormSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  try {
    const {
      UPLOADTHING_SECRET,
      UPLOADTHING_APP_ID,
      PUBLIC_URL,
      INSTALLATION_ID,
    } = parsedFormData.data;

    const data = [
      { key: 'UPLOADTHING_SECRET', value: UPLOADTHING_SECRET },
      { key: 'UPLOADTHING_APP_ID', value: UPLOADTHING_APP_ID },
    ];

    // add optional env variables if they were provided
    if (PUBLIC_URL) {
      data.push({ key: 'PUBLIC_URL', value: PUBLIC_URL });
    }

    // add the default env variables
    data.push({ key: 'SANDBOX_MODE', value: 'false' });
    data.push({ key: 'DISABLE_ANALYTICS', value: 'false' });

    await prisma.appSettings.createMany({
      data,
    });

    if (INSTALLATION_ID) {
      await prisma.appSettings.update({
        where: { key: 'INSTALLATION_ID' },
        data: { value: INSTALLATION_ID },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to store environment',
    };
  }
}

export async function setSandboxMode(sandboxMode: boolean) {
  await prisma.appSettings.update({
    where: { key: 'SANDBOX_MODE' },
    data: {
      value: sandboxMode.toString(),
    },
  });
  safeRevalidateTag('getSandboxMode');
  return sandboxMode;
}

export async function setDisableAnalytics(disableAnalytics: boolean) {
  await prisma.appSettings.update({
    where: { key: 'DISABLE_ANALYTICS' },
    data: {
      value: disableAnalytics.toString(),
    },
  });
  safeRevalidateTag('getDisableAnalytics');
  return disableAnalytics;
}
