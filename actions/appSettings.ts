'use server';

import { redirect } from 'next/navigation';
import { type z } from 'zod';
import { DEFAULT_APP_SETTINGS } from '~/fresco.config';
import { safeRevalidateTag } from '~/lib/cache';
import { appSettingSchema } from '~/schemas/appSettings';
import { createEnvironmentFormSchema } from '~/schemas/environment';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

// Generic function to set an app setting with validation
export async function setAppSetting<
  Key extends keyof z.infer<typeof appSettingSchema>,
>(key: Key, value: z.infer<typeof appSettingSchema>[Key]) {
  await requireApiAuth();

  // validate
  appSettingSchema.shape[key].parse(value);

  await prisma.appSettings.upsert({
    where: { key },
    update: {
      value:
        typeof value === 'boolean'
          ? value.toString()
          : value instanceof Date
            ? value.toISOString()
            : value,
    },
    create: {
      key: key,
      value:
        typeof value === 'boolean'
          ? value.toString()
          : value instanceof Date
            ? value.toISOString()
            : value,
    },
  });

  // handle revalidation tag
  safeRevalidateTag(`appSettings-${key}`);
  return value;
}

export const setAppConfigured = async () => {
  await requireApiAuth();

  try {
    await setAppSetting('configured', true);
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

    await setAppSetting('UPLOADTHING_APP_ID', UPLOADTHING_APP_ID);
    await setAppSetting('UPLOADTHING_SECRET', UPLOADTHING_SECRET);

    // add the default env variables
    await setAppSetting('SANDBOX_MODE', false);
    await setAppSetting('DISABLE_ANALYTICS', false);

    // add optional env variables if they were provided
    if (PUBLIC_URL) {
      await setAppSetting('PUBLIC_URL', PUBLIC_URL);
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

export async function initializeWithDefaults() {
  const data = Object.entries(DEFAULT_APP_SETTINGS).map(([key, value]) => ({
    key: key as keyof typeof DEFAULT_APP_SETTINGS,
    value:
      typeof value === 'boolean'
        ? value.toString()
        : value instanceof Date
          ? value.toISOString()
          : value,
  }));

  const appSettings = await prisma.appSettings.createManyAndReturn({
    data,
    skipDuplicates: true,
  });

  return appSettings;
}
