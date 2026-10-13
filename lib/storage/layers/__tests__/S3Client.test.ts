import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { describe, expect, it, vi } from 'vitest';

import { getS3PublicClient } from '~/lib/storage/layers/S3Client';

vi.mock('server-only', () => ({}));
vi.mock('~/lib/storage/config', () => ({
  getStorageConfig: () =>
    Promise.resolve({
      provider: 's3',
      endpoint: 'http://garage:3900',
      publicUrl: 'https://fresco.example.org',
      bucket: 'assets',
      region: 'us-east-1',
      accessKeyId: 'GK0123456789abcdef01234567',
      secretAccessKey: '0'.repeat(64),
    }),
}));

describe('getS3PublicClient', () => {
  it('presigns uploads without a checksum of the not-yet-sent body', async () => {
    const url = new URL(
      await getSignedUrl(
        await getS3PublicClient(),
        new PutObjectCommand({
          Bucket: 'assets',
          Key: 'a.png',
          ContentLength: 5,
        }),
        { expiresIn: 60 },
      ),
    );
    const params = [...url.searchParams.keys()].map((k) => k.toLowerCase());
    expect(params.filter((k) => k.includes('checksum'))).toEqual([]);
  });
});
