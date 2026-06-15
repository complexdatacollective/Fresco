'use server';

import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { type z } from 'zod';
import { z as zm } from 'zod/mini';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureEvent, shutdownPostHog } from '~/lib/posthog-server';
import { getStorageEnvStatus } from '~/lib/storage/config';
import { getInstallationId } from '~/queries/appSettings';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
  createUploadThingTokenFormSchema,
} from '~/schemas/appSettings';
import { ensureError } from '~/utils/ensureError';
import { getStringValue } from '~/utils/serializeHelpers';

const S3_SETTING_KEYS: AppSetting[] = [
  's3Endpoint',
  's3PublicUrl',
  's3Bucket',
  's3Region',
  's3AccessKeyId',
  's3SecretAccessKey',
];

/**
 * Storage settings managed via environment variables must not be editable
 * through server actions — UI locking alone would be cosmetic.
 */
function isStorageSettingEnvManaged(key: AppSetting): boolean {
  const status = getStorageEnvStatus();
  if (key === 'storageProvider') return status.pinnedProvider !== null;
  if (S3_SETTING_KEYS.includes(key)) return status.s3EnvManaged;
  if (key === 'uploadThingToken') return status.uploadThingEnvManaged;
  return false;
}

export async function setAppSetting<
  Key extends AppSetting,
  V extends z.infer<typeof appSettingPreprocessedSchema>[Key],
>(key: Key, value: V): Promise<V> {
  const session = await requireApiAuth();

  if (!appSettingPreprocessedSchema.shape[key]) {
    throw new Error(`Invalid app setting: ${key}`);
  }

  if (isStorageSettingEnvManaged(key)) {
    throw new Error(
      'Storage is configured via environment variables and cannot be changed here.',
    );
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

    // Validate the serialized value against the same schema the read path
    // uses (queries/appSettings.ts), so a stored value can never throw on
    // read-back (e.g. a malformed URL for s3PublicUrl).
    const validated =
      appSettingPreprocessedSchema.shape[key].safeParse(stringValue);
    if (!validated.success) {
      throw new Error(`Invalid value for app setting ${key}`);
    }

    await prisma.appSettings.upsert({
      where: { key },
      create: { key, value: stringValue },
      update: { value: stringValue },
    });

    safeUpdateTag(`appSettings-${key}`);

    const REDACTED_KEYS: AppSetting[] = [
      'uploadThingToken',
      's3SecretAccessKey',
      's3AccessKeyId',
    ];
    const displayValue = REDACTED_KEYS.includes(key)
      ? '[REDACTED]'
      : String(value);

    await addEvent(
      'Setting Changed',
      `"${session.user.username}" changed "${key}" to "${displayValue}"`,
    );

    return value;
  } catch (error) {
    const e = ensureError(error);
    throw new Error(`Failed to update appSettings: ${key}: ${e.message}`);
  }
}

export async function setUploadThingToken(rawData: unknown) {
  await requireApiAuth();

  if (getStorageEnvStatus().uploadThingEnvManaged) {
    return {
      success: false as const,
      fieldErrors: {
        uploadThingToken: [
          'The UploadThing token is configured via the UPLOADTHING_TOKEN environment variable and cannot be changed here.',
        ],
      },
    };
  }

  const parsed = createUploadThingTokenFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const flattened = zm.flattenError(parsed.error);
    return {
      success: false as const,
      fieldErrors: flattened.fieldErrors,
    };
  }

  const token = parsed.data.uploadThingToken;

  // Verify the token is structurally valid (base64 JSON with expected fields)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded) as Record<string, unknown>;
    if (!data.apiKey || !data.appId) {
      return {
        success: false as const,
        fieldErrors: {
          uploadThingToken: [
            'Token is missing required fields (apiKey, appId).',
          ],
        },
      };
    }
  } catch {
    return {
      success: false as const,
      fieldErrors: {
        uploadThingToken: [
          'Token is not valid. Make sure you copied the full token.',
        ],
      },
    };
  }

  const verifyError = await verifyUploadThingToken(token);
  if (verifyError) {
    return {
      success: false as const,
      fieldErrors: {
        uploadThingToken: [verifyError],
      },
    };
  }

  await setAppSetting('uploadThingToken', token);
  return { success: true as const };
}

async function verifyUploadThingToken(token: string): Promise<string | null> {
  try {
    const { UTApi } = await import('uploadthing/server');
    const utapi = new UTApi({ token });
    // getUsageInfo makes an authenticated request to UploadThing; it succeeds
    // only if the token is valid.
    await utapi.getUsageInfo();
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Token verification failed: ${message}`;
  }
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
