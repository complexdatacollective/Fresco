'use server';

import { SeverityNumber } from '@opentelemetry/api-logs';
import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { type z } from 'zod';
import { APP_NAME } from '~/fresco.config';
import { loggerProvider } from '~/instrumentation';
import { trackServerEvent } from '~/lib/analytics/trackServerEvent';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
} from '~/schemas/appSettings';
import { requireApiAuth } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';
import { getStringValue } from '~/utils/serializeHelpers';

const logger = loggerProvider.getLogger(APP_NAME);

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

    safeUpdateTag(`appSettings-${key}`);

    return value;
  } catch (error) {
    const e = ensureError(error);
    throw new Error(`Failed to update appSettings: ${key}: ${e.message}`);
  }
}

export async function completeSetup() {
  // Allow overriding with process.env.INSTALLATION_ID for CI and dev
  // eslint-disable-next-line no-process-env
  const installationId = process.env.INSTALLATION_ID ?? createId();
  await setAppSetting('installationId', installationId);
  await setAppSetting('configured', true);
  void trackServerEvent('AppSetup', { installationId });

  logger.emit({
    body: 'App setup completed',
    severityNumber: SeverityNumber.INFO,
    attributes: {
      installationId,
    },
  });

  // Ensure logs are flushed before the serverless function freezes
  after(async () => {
    await loggerProvider.forceFlush();
  });

  redirect('/dashboard');
}
