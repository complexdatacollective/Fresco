'use server';

import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { z as zm } from 'zod/mini';
import { setAppSetting } from '~/actions/appSettings';
import { requireApiAuth } from '~/lib/auth/guards';
import { getStorageEnvStatus } from '~/lib/storage/config';
import { hasProtocols, type StorageProvider } from '~/queries/storageProvider';
import { s3ConfigSchema } from '~/schemas/s3Settings';

export async function setStorageProvider(provider: StorageProvider) {
  await requireApiAuth();

  const { pinnedProvider } = getStorageEnvStatus();
  if (pinnedProvider !== null) {
    // When STORAGE_PROVIDER pins the same provider the database value is
    // irrelevant, so treat this as a successful no-op. A conflicting value
    // is an error.
    if (pinnedProvider === provider) {
      return { success: true as const };
    }
    return {
      success: false as const,
      error:
        'The storage provider is configured via the STORAGE_PROVIDER environment variable and cannot be changed here.',
    };
  }

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

  const envStatus = getStorageEnvStatus();
  if (envStatus.s3EnvManaged) {
    return {
      success: false as const,
      fieldErrors: {},
      error:
        'S3 storage is configured via environment variables and cannot be changed here.',
    };
  }
  if (envStatus.pinnedProvider && envStatus.pinnedProvider !== 's3') {
    return {
      success: false as const,
      fieldErrors: {},
      error:
        'The storage provider is pinned to UploadThing via the STORAGE_PROVIDER environment variable.',
    };
  }

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

  // When STORAGE_PROVIDER is pinned to 's3' via env the database provider
  // value is ignored (and setAppSetting would reject the write).
  if (!envStatus.pinnedProvider) {
    await setAppSetting('storageProvider', 's3');
  }
  await setAppSetting('s3Endpoint', s3Endpoint);
  await setAppSetting('s3PublicUrl', s3PublicUrl);
  await setAppSetting('s3Bucket', s3Bucket);
  await setAppSetting('s3Region', s3Region);
  await setAppSetting('s3AccessKeyId', s3AccessKeyId);
  await setAppSetting('s3SecretAccessKey', s3SecretAccessKey);

  return { success: true as const };
}
