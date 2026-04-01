import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Effect, Layer } from 'effect';
import { FileStorageError, getUserMessage } from '~/lib/storage/errors';
import { FileStorage } from '~/lib/storage/services/FileStorage';
import {
  getS3Bucket,
  getS3Client,
  getS3PublicBaseUrl,
} from '~/lib/storage/layers/S3Client';

export const S3FileStorage = Layer.succeed(FileStorage, {
  upload: (fileBuffer, fileName) =>
    Effect.gen(function* () {
      const [client, bucket, baseUrl] = yield* Effect.tryPromise({
        try: () =>
          Promise.all([getS3Client(), getS3Bucket(), getS3PublicBaseUrl()]),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'retrieving storage credentials',
            ),
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: fileName,
              Body: fileBuffer,
              ContentType: 'application/zip',
            }),
          ),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'uploading zip file'),
          }),
      });

      return { url: `${baseUrl}/${fileName}`, key: fileName };
    }),

  delete: (key) =>
    Effect.gen(function* () {
      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3Client(), getS3Bucket()]),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'retrieving storage credentials',
            ),
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: key,
            }),
          ),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'deleting file from storage'),
          }),
      });
    }),

  getDownloadUrl: (key) =>
    Effect.gen(function* () {
      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3Client(), getS3Bucket()]),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'retrieving storage credentials',
            ),
          }),
      });

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return yield* Effect.tryPromise({
        try: () => getSignedUrl(client, command, { expiresIn: 3600 }),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'generating download URL'),
          }),
      });
    }),
});
