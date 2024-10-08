'use server';

import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import { type z } from 'zod';
import { env } from '~/env';
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

  if (!appSettingSchema.shape[key]) {
    throw new Error(`Invalid app setting key: ${key}`);
  }

  // validate
  appSettingSchema.shape[key].parse(value);

  const existingSetting = await prisma.appSettings.findUnique({
    where: { key },
  });

  const formattedValue =
    typeof value === 'boolean'
      ? value.toString()
      : value instanceof Date
        ? value.toISOString()
        : value;

  if (existingSetting) {
    await prisma.appSettings.update({
      where: { key },
      data: { value: formattedValue },
    });
  } else {
    await prisma.appSettings.create({
      data: { key, value: formattedValue },
    });
  }

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
  await requireApiAuth();
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

    const data = [
      { key: 'UPLOADTHING_APP_ID', value: UPLOADTHING_APP_ID },
      { key: 'UPLOADTHING_SECRET', value: UPLOADTHING_SECRET },
      { key: 'SANDBOX_MODE', value: 'false' },
      { key: 'DISABLE_ANALYTICS', value: 'false' },
    ];

    // Add optional env variables if they were provided
    if (PUBLIC_URL) {
      data.push({ key: 'PUBLIC_URL', value: PUBLIC_URL });
    }

    if (INSTALLATION_ID) {
      await setAppSetting('installationId', INSTALLATION_ID);
    } else {
      // no env or installation id provided, generate one
      await setAppSetting('installationId', createId());
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
  await requireApiAuth();
  const data = Object.entries(DEFAULT_APP_SETTINGS).map(([key, value]) => ({
    key: key as keyof typeof DEFAULT_APP_SETTINGS,
    value: typeof value === 'boolean' ? value.toString() : value,
  }));

  // add installation id if there is one in the env
  const installationId = env.INSTALLATION_ID;
  if (installationId) {
    data.push({
      key: 'installationId',
      value: installationId,
    });
  }

  const appSettings = await prisma.appSettings.createManyAndReturn({
    data,
    skipDuplicates: true,
  });

  console.log('Initialized app settings with defaults', appSettings);

  return appSettings;
}
