import { S3Client } from '@aws-sdk/client-s3';
import { getStorageConfig, type S3StorageConfig } from '~/lib/storage/config';

async function getS3Config(): Promise<S3StorageConfig> {
  const config = await getStorageConfig();
  if (config.provider !== 's3') {
    throw new Error('S3 is not the configured storage provider');
  }
  return config;
}

function makeClient(endpoint: string, config: S3StorageConfig): S3Client {
  return new S3Client({
    endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Required for MinIO and for bucket-in-path URLs that the reverse-proxy
    // path route depends on.
    forcePathStyle: true,
  });
}

/** Sends requests to the (possibly internal) S3 endpoint. */
export async function getS3ServerClient(): Promise<S3Client> {
  const config = await getS3Config();
  return makeClient(config.endpoint, config);
}

/**
 * Never sends requests — used only to SIGN browser-facing presigned URLs.
 * SigV4 binds host and path, so signing must happen against the public URL.
 */
export async function getS3PublicClient(): Promise<S3Client> {
  const config = await getS3Config();
  return makeClient(config.publicUrl, config);
}

export async function getS3Bucket(): Promise<string> {
  const config = await getS3Config();
  return config.bucket;
}
