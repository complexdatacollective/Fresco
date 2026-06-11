'use server';

import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { z as zm } from 'zod/mini';
import { setAppSetting } from '~/actions/appSettings';
import { requireApiAuth } from '~/lib/auth/guards';
import { hasProtocols, type StorageProvider } from '~/queries/storageProvider';
import { s3ConfigSchema } from '~/schemas/s3Settings';

export async function setStorageProvider(provider: StorageProvider) {
  await requireApiAuth();

  const protocolsExist = await hasProtocols();
  if (protocolsExist) {
    return {
      success: false as const,
      error:
        'Cannot change storage provider after protocols have been uploaded.',
    };
  }

  await setAppSetting('storageProvider', provider);
  return { success: true as const };
}

export async function saveS3Config(rawData: unknown) {
  await requireApiAuth();

  const protocolsExist = await hasProtocols();
  if (protocolsExist) {
    return {
      success: false as const,
      fieldErrors: {},
      error:
        'Cannot change storage configuration after protocols have been uploaded.',
    };
  }

  const parsed = s3ConfigSchema.safeParse(rawData);
  if (!parsed.success) {
    const flattened = zm.flattenError(parsed.error);
    return {
      success: false as const,
      fieldErrors: flattened.fieldErrors,
    };
  }

  const {
    s3Endpoint,
    s3PublicUrl,
    s3Bucket,
    s3Region,
    s3AccessKeyId,
    s3SecretAccessKey,
  } = parsed.data;

  // Validate credentials by attempting a HeadBucket call
  try {
    const client = new S3Client({
      endpoint: s3Endpoint,
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
      forcePathStyle: true,
    });

    await client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Connection failed';
    return {
      success: false as const,
      fieldErrors: {},
      error: `Could not connect to S3 bucket: ${message}`,
    };
  }

  await setAppSetting('storageProvider', 's3');
  await setAppSetting('s3Endpoint', s3Endpoint);
  await setAppSetting('s3PublicUrl', s3PublicUrl);
  await setAppSetting('s3Bucket', s3Bucket);
  await setAppSetting('s3Region', s3Region);
  await setAppSetting('s3AccessKeyId', s3AccessKeyId);
  await setAppSetting('s3SecretAccessKey', s3SecretAccessKey);

  return { success: true as const };
}
