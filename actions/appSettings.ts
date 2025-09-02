'use server';

import { redirect } from 'next/navigation';
import { type z } from 'zod/v3';
import { safeRevalidateTag } from '~/lib/cache';
import { type AppSetting, appSettingsSchema } from '~/schemas/appSettings';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';
import { getStringValue } from '~/utils/getStringValue';

export async function setAppSetting<
  Key extends AppSetting,
  V extends z.infer<typeof appSettingsSchema>[Key],
>(key: Key, value: V): Promise<V> {
  await requireApiAuth();

  if (!appSettingsSchema.shape[key]) {
    throw new Error(`Invalid app setting: ${key}`);
  }

  try {
    const result = appSettingsSchema.shape[key].parse(value);
    const stringValue = getStringValue(result);

    await prisma.appSettings.upsert({
      where: { key },
      create: { key, value: stringValue },
      update: { value: stringValue },
    });

    safeRevalidateTag(`appSettings-${key}`);

    return value;
  } catch (error) {
    const e = ensureError(error);
    throw new Error(`Failed to update appSettings: ${key}: ${e.message}`);
  }
}

export async function submitUploadThingForm(token: string) {
  await setAppSetting('uploadThingToken', token);
  redirect('/setup?step=3');
}
