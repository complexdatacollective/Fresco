import 'server-only';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';

export type S3StorageConfig = {
  provider: 's3';
  /** Server-side S3 API target (internal in Docker deployments). */
  endpoint: string;
  /** Browser-facing base used to sign presigned PUT/GET URLs. */
  publicUrl: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  envManaged: boolean;
};

type UploadThingStorageConfig = {
  provider: 'uploadthing';
  token: string;
  envManaged: boolean;
};

export type StorageConfig = S3StorageConfig | UploadThingStorageConfig;

function isProviderEnvManaged(provider: 'uploadthing' | 's3'): boolean {
  if (provider === 's3') {
    return Boolean(
      env.S3_ENDPOINT ??
      env.S3_PUBLIC_URL ??
      env.S3_BUCKET ??
      env.S3_REGION ??
      env.S3_ACCESS_KEY_ID ??
      env.S3_SECRET_ACCESS_KEY,
    );
  }
  return Boolean(env.UPLOADTHING_TOKEN);
}

export type StorageEnvStatus = {
  pinnedProvider: 's3' | 'uploadthing' | null;
  s3EnvManaged: boolean;
  uploadThingEnvManaged: boolean;
  /** Names of the storage env vars currently set, for display in lock alerts. */
  setVariables: string[];
};

/** Non-throwing env introspection for settings/onboarding UI. */
export function getStorageEnvStatus(): StorageEnvStatus {
  const storageEnvVars = {
    STORAGE_PROVIDER: env.STORAGE_PROVIDER,
    S3_ENDPOINT: env.S3_ENDPOINT,
    S3_PUBLIC_URL: env.S3_PUBLIC_URL,
    S3_BUCKET: env.S3_BUCKET,
    S3_REGION: env.S3_REGION,
    S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
    UPLOADTHING_TOKEN: env.UPLOADTHING_TOKEN,
  };

  return {
    pinnedProvider: env.STORAGE_PROVIDER ?? null,
    s3EnvManaged: isProviderEnvManaged('s3'),
    uploadThingEnvManaged: isProviderEnvManaged('uploadthing'),
    setVariables: Object.entries(storageEnvVars)
      .filter(([, value]) => Boolean(value))
      .map(([name]) => name),
  };
}

/**
 * Resolves the active storage configuration.
 *
 * - Provider selection order: `STORAGE_PROVIDER` env var → `storageProvider`
 *   app setting → `'uploadthing'`.
 * - Each credential field independently prefers its env var over the
 *   database app setting.
 * - `envManaged` is true when any credential env var for the ACTIVE provider
 *   is set (used by the UI to lock env-controlled fields).
 * - Throws when the active provider is incompletely configured.
 */
export async function getStorageConfig(): Promise<StorageConfig> {
  const provider =
    env.STORAGE_PROVIDER ??
    (await getAppSetting('storageProvider')) ??
    'uploadthing';

  if (provider === 's3') {
    const [endpoint, publicUrl, bucket, region, accessKeyId, secretAccessKey] =
      await Promise.all([
        env.S3_ENDPOINT ?? getAppSetting('s3Endpoint'),
        env.S3_PUBLIC_URL ?? getAppSetting('s3PublicUrl'),
        env.S3_BUCKET ?? getAppSetting('s3Bucket'),
        env.S3_REGION ?? getAppSetting('s3Region'),
        env.S3_ACCESS_KEY_ID ?? getAppSetting('s3AccessKeyId'),
        env.S3_SECRET_ACCESS_KEY ?? getAppSetting('s3SecretAccessKey'),
      ]);

    if (
      !endpoint ||
      !publicUrl ||
      !bucket ||
      !region ||
      !accessKeyId ||
      !secretAccessKey
    ) {
      const fields: Record<string, string | undefined> = {
        endpoint,
        publicUrl,
        bucket,
        region,
        accessKeyId,
        secretAccessKey,
      };
      const missing = Object.keys(fields).filter((key) => !fields[key]);
      throw new Error(
        `S3 storage is not fully configured. Missing: ${missing.join(', ')}.`,
      );
    }

    return {
      provider: 's3',
      endpoint,
      publicUrl,
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      envManaged: isProviderEnvManaged('s3'),
    };
  }

  const token =
    env.UPLOADTHING_TOKEN ?? (await getAppSetting('uploadThingToken'));
  if (!token) {
    throw new Error('UploadThing token is not configured.');
  }

  return {
    provider: 'uploadthing',
    token,
    envManaged: isProviderEnvManaged('uploadthing'),
  };
}
