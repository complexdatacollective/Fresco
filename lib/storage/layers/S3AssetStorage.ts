import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Effect, Layer } from 'effect';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AssetStorageError } from '~/lib/storage/errors';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import {
  getS3Bucket,
  getS3PublicClient,
  getS3ServerClient,
} from '~/lib/storage/layers/S3Client';

function generateS3Key(fileName: string): string {
  // The key is embedded in /api/assets/{key} URLs, so strip any
  // URL-significant characters (#, ?, etc.) the user's filename may carry.
  const ext = extname(fileName)
    .toLowerCase()
    .replace(/[^.a-z0-9]/g, '');
  return `${randomUUID()}${ext}`;
}

export const S3AssetStorage = Layer.succeed(AssetStorage, {
  generatePresignedUploadUrls: (files) =>
    Effect.gen(function* () {
      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3PublicClient(), getS3Bucket()]),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to connect to storage provider.',
          }),
      });

      const results = yield* Effect.forEach(files, (file) =>
        Effect.gen(function* () {
          const fileKey = generateS3Key(file.name);

          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            ContentLength: file.size,
          });

          const uploadUrl = yield* Effect.tryPromise({
            try: () => getSignedUrl(client, command, { expiresIn: 3600 }),
            catch: (error) =>
              new AssetStorageError({
                cause: error,
                userMessage: `Failed to generate upload URL for ${file.name}.`,
              }),
          });

          return {
            uploadUrl,
            fileKey,
            publicUrl: `/api/assets/${fileKey}`,
          };
        }),
      );

      return results;
    }),

  deleteAssets: (keys) =>
    Effect.gen(function* () {
      if (keys.length === 0) return;

      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3ServerClient(), getS3Bucket()]),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to connect to storage provider.',
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: keys.map((key) => ({ Key: key })),
              },
            }),
          ),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to delete assets from storage.',
          }),
      });
    }),
});
