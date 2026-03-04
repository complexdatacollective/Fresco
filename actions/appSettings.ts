'use server';

import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { type z } from 'zod';
import { z as zm } from 'zod/mini';
import { captureEvent, shutdownPostHog } from '~/lib/posthog-server';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { getInstallationId } from '~/queries/appSettings';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
  createUploadThingTokenFormSchema,
} from '~/schemas/appSettings';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';
import { getStringValue } from '~/utils/serializeHelpers';

export async function setAppSetting<
  Key extends AppSetting,
  V extends z.infer<typeof appSettingPreprocessedSchema>[Key],
>(key: Key, value: V): Promise<V> {
  const session = await requireApiAuth();

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

    safeUpdateTag(`appSettings-${key}`);

    await addEvent(
      'Setting Changed',
      `"${session.user.username}" changed "${key}" to "${String(value)}"`,
    );

    return value;
  } catch (error) {
    const e = ensureError(error);
    throw new Error(`Failed to update appSettings: ${key}: ${e.message}`);
  }
}

export async function setUploadThingToken(rawData: unknown) {
  await requireApiAuth();

  const parsed = createUploadThingTokenFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const flattened = zm.flattenError(parsed.error);
    return {
      success: false as const,
      fieldErrors: flattened.fieldErrors,
    };
  }

  await setAppSetting('uploadThingToken', parsed.data.uploadThingToken);
  return { success: true as const };
}

export async function regenerateInstallationId() {
  await requireApiAuth();
  const newId = createId();
  await setAppSetting('installationId', newId);
  return newId;
}

export async function completeSetup() {
  const installationId = await getInstallationId();
  if (!installationId) {
    await setAppSetting('installationId', createId());
  }
  await setAppSetting('configured', true);
  after(async () => {
    await captureEvent('AppSetup', {
      installationId,
    });
    await shutdownPostHog();
  });

  redirect('/dashboard');
}
