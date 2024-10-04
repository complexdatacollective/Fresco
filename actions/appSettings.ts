'use server';

import { redirect } from 'next/navigation';
import { type z } from 'zod';
import { safeRevalidateTag } from '~/lib/cache';
import { appSettingSchema } from '~/schemas/appSettings';
import { createEnvironmentFormSchema } from '~/schemas/environment';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

// Generic function to set an app setting with validation
export async function setAppSetting<
  Key extends keyof z.infer<typeof appSettingSchema>,
>(key: Key, value: z.infer<typeof appSettingSchema>[Key]) {
  console.log('setting app setting', key, value);

  // validate
  appSettingSchema.shape[key].parse(value);

  await prisma.appSettings.update({
    where: { key },
    data: {
      key: key,
      value:
        typeof value === 'boolean' ? value.toString() : JSON.stringify(value),
    },
  });

  // handle revalidation tag
  // safeRevalidateTag('appSettings', key);
  return value;
}

export async function createAppSetting<
  Key extends keyof z.infer<typeof appSettingSchema>,
>(key: Key, value: z.infer<typeof appSettingSchema>[Key]) {
  await prisma.appSettings.create({
    data: {
      key: key,
      value:
        typeof value === 'boolean' ? value.toString() : JSON.stringify(value),
    },
  });

  return value;
}

export async function setAnonymousRecruitment(input: boolean) {
  await requireApiAuth();
  await setAppSetting('allowAnonymousRecruitment', input);
  safeRevalidateTag('allowAnonymousRecruitment');
  return input;
}

export async function setLimitInterviews(input: boolean) {
  await requireApiAuth();
  await setAppSetting('limitInterviews', input);
  safeRevalidateTag('limitInterviews');
  return input;
}

export const setAppConfigured = async () => {
  await requireApiAuth();

  try {
    await setAppSetting('configured', true);
    safeRevalidateTag('appSettings');
  } catch (error) {
    return { error: 'Failed to update appSettings', appSettings: null };
  }
  redirect('/dashboard');
};

export async function storeEnvironment(formData: unknown) {
  const parsedFormData = createEnvironmentFormSchema.safeParse(formData);

  if (!parsedFormData.success) {
    console.error('Invalid form submission', parsedFormData.error);
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

    await createAppSetting('UPLOADTHING_APP_ID', UPLOADTHING_APP_ID);
    await createAppSetting('UPLOADTHING_SECRET', UPLOADTHING_SECRET);

    // add the default env variables
    await createAppSetting('SANDBOX_MODE', false);
    await createAppSetting('DISABLE_ANALYTICS', false);

    // add optional env variables if they were provided
    if (PUBLIC_URL) {
      await createAppSetting('PUBLIC_URL', PUBLIC_URL);
    }

    if (INSTALLATION_ID) {
      await setAppSetting('installationId', INSTALLATION_ID);
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
  await setAppSetting('SANDBOX_MODE', sandboxMode);
  safeRevalidateTag('getSandboxMode');
  return sandboxMode;
}

export async function setDisableAnalytics(disableAnalytics: boolean) {
  await setAppSetting('DISABLE_ANALYTICS', disableAnalytics);
  safeRevalidateTag('getDisableAnalytics');
  return disableAnalytics;
}
