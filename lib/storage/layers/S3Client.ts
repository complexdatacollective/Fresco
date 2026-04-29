import { S3Client } from '@aws-sdk/client-s3';
import { getAppSetting } from '~/queries/appSettings';

export async function getS3Client(): Promise<S3Client> {
  const [endpoint, region, accessKeyId, secretAccessKey] = await Promise.all([
    getAppSetting('s3Endpoint'),
    getAppSetting('s3Region'),
    getAppSetting('s3AccessKeyId'),
    getAppSetting('s3SecretAccessKey'),
  ]);

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 credentials are not configured');
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export async function getS3Bucket(): Promise<string> {
  const bucket = await getAppSetting('s3Bucket');
  if (!bucket) {
    throw new Error('S3 bucket is not configured');
  }
  return bucket;
}

export async function getS3PublicBaseUrl(): Promise<string> {
  const [endpoint, bucket] = await Promise.all([
    getAppSetting('s3Endpoint'),
    getAppSetting('s3Bucket'),
  ]);

  if (!endpoint || !bucket) {
    throw new Error('S3 configuration is incomplete');
  }

  return `${endpoint.replace(/\/$/, '')}/${bucket}`;
}
