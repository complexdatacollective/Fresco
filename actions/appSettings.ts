'use server';

import { redirect } from 'next/navigation';
import { type z } from 'zod';
import { safeRevalidateTag } from '~/lib/cache';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
} from '~/schemas/appSettings';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/lib/db';
import { ensureError } from '~/utils/ensureError';
import { getStringValue } from '~/utils/getStringValue';

export async function setAppSetting<
  Key extends AppSetting,
  V extends z.infer<typeof appSettingPreprocessedSchema>[Key],
>(key: Key, value: V): Promise<V> {
  await requireApiAuth();

  if (!appSettingPreprocessedSchema.shape[key]) {
    throw new Error(`Invalid app setting: ${key}`);
  }

  try {
    // Null values are not supported - caller should not pass null
    if (value === null) {
      throw new Error('Cannot set app setting to null');
    }

    // Convert the typed value to a database string
    // Filter out undefined values as they're not supported by getStringValue
    if (value === undefined) {
      throw new Error('Cannot set app setting to undefined');
    }
    const stringValue = getStringValue(value);

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
