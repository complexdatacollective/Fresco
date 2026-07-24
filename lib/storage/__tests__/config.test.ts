import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockEnv, mockGetAppSetting } = vi.hoisted(() => {
  const mockEnv: Record<string, string | undefined> = {};
  const mockGetAppSetting = vi.fn();
  return { mockEnv, mockGetAppSetting };
});

vi.mock('~/env', () => ({ env: mockEnv }));
vi.mock('~/queries/appSettings', () => ({ getAppSetting: mockGetAppSetting }));

import { getStorageConfig, getStorageEnvStatus } from '~/lib/storage/config';

function clearEnv() {
  for (const key of Object.keys(mockEnv)) delete mockEnv[key];
}

const dbS3: Record<string, string> = {
  storageProvider: 's3',
  s3Endpoint: 'http://minio:9000',
  s3PublicUrl: 'https://app.example.com',
  s3Bucket: 'fresco',
  s3Region: 'us-east-1',
  s3AccessKeyId: 'db-key',
  s3SecretAccessKey: 'db-secret',
  uploadThingToken: 'db-token',
};

beforeEach(() => {
  clearEnv();
  vi.clearAllMocks();
  mockGetAppSetting.mockImplementation((key: string) =>
    Promise.resolve(dbS3[key]),
  );
});

describe('getStorageConfig', () => {
  it('resolves S3 config from app settings', async () => {
    const config = await getStorageConfig();
    expect(config).toEqual({
      provider: 's3',
      endpoint: 'http://minio:9000',
      publicUrl: 'https://app.example.com',
      bucket: 'fresco',
      region: 'us-east-1',
      accessKeyId: 'db-key',
      secretAccessKey: 'db-secret',
      envManaged: false,
    });
  });

  it('prefers env vars over app settings per field', async () => {
    mockEnv.S3_ENDPOINT = 'http://env-minio:9000';
    mockEnv.S3_ACCESS_KEY_ID = 'env-key';

    const config = await getStorageConfig();
    expect(config).toMatchObject({
      endpoint: 'http://env-minio:9000',
      accessKeyId: 'env-key',
      secretAccessKey: 'db-secret',
      envManaged: true,
    });
  });

  it('resolves env bucket with remaining fields from DB and envManaged true', async () => {
    mockEnv.S3_BUCKET = 'env-bucket';

    const config = await getStorageConfig();
    expect(config).toEqual({
      provider: 's3',
      endpoint: 'http://minio:9000',
      publicUrl: 'https://app.example.com',
      bucket: 'env-bucket',
      region: 'us-east-1',
      accessKeyId: 'db-key',
      secretAccessKey: 'db-secret',
      envManaged: true,
    });
  });

  it('selects provider from STORAGE_PROVIDER env var', async () => {
    mockEnv.STORAGE_PROVIDER = 'uploadthing';
    mockEnv.UPLOADTHING_TOKEN = 'env-token';

    const config = await getStorageConfig();
    expect(config).toMatchObject({
      provider: 'uploadthing',
      token: 'env-token',
    });
  });

  it('throws a descriptive error naming missing fields for partial S3 config', async () => {
    mockGetAppSetting.mockImplementation((key: string) =>
      Promise.resolve(key === 'storageProvider' ? 's3' : undefined),
    );
    await expect(getStorageConfig()).rejects.toThrow(/not fully configured/);
    await expect(getStorageConfig()).rejects.toThrow(/Missing: .*publicUrl/);
  });

  it('throws when UploadThing provider has no token configured', async () => {
    mockGetAppSetting.mockResolvedValue(undefined);
    mockEnv.STORAGE_PROVIDER = 'uploadthing';
    await expect(getStorageConfig()).rejects.toThrow(/token is not configured/);
  });

  it('resolves S3 config from DB with envManaged false when provider pinned via env but creds from DB', async () => {
    mockEnv.STORAGE_PROVIDER = 's3';
    const config = await getStorageConfig();
    expect(config).toMatchObject({
      provider: 's3',
      endpoint: 'http://minio:9000',
      publicUrl: 'https://app.example.com',
      bucket: 'fresco',
      region: 'us-east-1',
      accessKeyId: 'db-key',
      secretAccessKey: 'db-secret',
      envManaged: false,
    });
  });
});

describe('getStorageEnvStatus', () => {
  it('returns unmanaged status with no storage env vars set', () => {
    expect(getStorageEnvStatus()).toEqual({
      pinnedProvider: null,
      s3EnvManaged: false,
      uploadThingEnvManaged: false,
      setVariables: [],
    });
  });

  it('returns the pinned provider but both envManaged false when only STORAGE_PROVIDER is set', () => {
    mockEnv.STORAGE_PROVIDER = 's3';
    expect(getStorageEnvStatus()).toEqual({
      pinnedProvider: 's3',
      s3EnvManaged: false,
      uploadThingEnvManaged: false,
      setVariables: ['STORAGE_PROVIDER'],
    });
  });

  it('returns s3EnvManaged true and uploadThingEnvManaged false when an S3 credential var is set', () => {
    mockEnv.S3_BUCKET = 'my-bucket';
    expect(getStorageEnvStatus()).toEqual({
      pinnedProvider: null,
      s3EnvManaged: true,
      uploadThingEnvManaged: false,
      setVariables: ['S3_BUCKET'],
    });
  });

  it('lists the exact names of every storage env var that is set', () => {
    mockEnv.S3_ACCESS_KEY_ID = 'env-key';
    mockEnv.S3_SECRET_ACCESS_KEY = 'env-secret';
    mockEnv.UPLOADTHING_TOKEN = 'env-token';
    expect(getStorageEnvStatus()).toEqual({
      pinnedProvider: null,
      s3EnvManaged: true,
      uploadThingEnvManaged: true,
      setVariables: [
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
        'UPLOADTHING_TOKEN',
      ],
    });
  });
});
