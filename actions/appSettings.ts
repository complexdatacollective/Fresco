'use server';

import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import { type z } from 'zod';
import { env } from '~/env';
import { DEFAULT_APP_SETTINGS } from '~/fresco.config';
import { safeRevalidateTag } from '~/lib/cache';
import { appSettingsSchema } from '~/schemas/appSettings';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

// Generic function to set an app setting with validation
export async function setAppSetting<
  Key extends keyof z.infer<typeof appSettingsSchema>,
>(key: Key, value: z.infer<typeof appSettingsSchema>[Key]) {
  await requireApiAuth();

  if (!appSettingsSchema.shape[key]) {
    throw new Error(`Invalid app setting key: ${key}`);
  }

  // validate
  appSettingsSchema.shape[key].parse(value);

  const formattedValue: string | undefined =
    typeof value === 'boolean'
      ? value.toString()
      : value instanceof Date
        ? value.toISOString()
        : value;

  try {
    await prisma.appSettings.upsert({
      where: { key },
      create: { key, value: formattedValue },
      update: { value: formattedValue },
    });
  } catch (error) {
    throw new Error(`Failed to update appSettings: ${key}`);
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

export async function initializeWithDefaults() {
  type InitializeKeys = keyof typeof DEFAULT_APP_SETTINGS | 'installationId';
  const data = Object.entries(DEFAULT_APP_SETTINGS).map(([key, value]) => ({
    key: key as keyof typeof DEFAULT_APP_SETTINGS,
    value: typeof value === 'boolean' ? value.toString() : value,
  })) as { key: InitializeKeys; value: string }[];

  // add installation id if there is one in the env
  // if not, generate one
  const installationId = env.INSTALLATION_ID ?? createId();
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

  return appSettings;
}
