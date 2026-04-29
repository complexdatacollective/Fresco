import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Effect, Layer } from 'effect';
import { File } from 'node:buffer';
import { type Readable } from 'node:stream';
import { buffer as streamToBuffer } from 'node:stream/consumers';
import { FileStorageError } from '~/lib/network-exporters/errors';
import { FileStorage } from '~/lib/network-exporters/services/FileStorage';
import { getS3Bucket, getS3Client } from '~/lib/storage/layers/S3Client';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { parseUploadThingToken } from '~/lib/uploadthing/token';
import type { StorageProvider } from '~/queries/storageProvider';

const S3NetworkExportersFileStorage = Layer.succeed(FileStorage, {
  upload: (stream: Readable, fileName: string) =>
    Effect.gen(function* () {
      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3Client(), getS3Bucket()]),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      yield* Effect.tryPromise({
        try: () =>
          new Upload({
            client,
            params: {
              Bucket: bucket,
              Key: fileName,
              Body: stream,
              ContentType: 'application/zip',
            },
          }).done(),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      return { key: fileName };
    }),

  getDownloadUrl: (key: string) =>
    Effect.gen(function* () {
      const [client, bucket] = yield* Effect.tryPromise({
        try: () => Promise.all([getS3Client(), getS3Bucket()]),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      return yield* Effect.tryPromise({
        try: () =>
          getSignedUrl(
            client,
            new GetObjectCommand({ Bucket: bucket, Key: key }),
            { expiresIn: 3600 },
          ),
        catch: (error) => new FileStorageError({ cause: error }),
      });
    }),
});

const UploadThingNetworkExportersFileStorage = Layer.succeed(FileStorage, {
  upload: (stream: Readable, fileName: string) =>
    Effect.gen(function* () {
      const utapi = yield* Effect.tryPromise({
        try: () => getUTApi(),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      const buf = yield* Effect.tryPromise({
        try: () => streamToBuffer(stream),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      const file = new File([buf], fileName, { type: 'application/zip' });

      const { data, error } = yield* Effect.tryPromise({
        try: () => utapi.uploadFiles(file),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      if (!data) {
        return yield* Effect.fail(
          new FileStorageError({
            cause: error ?? new Error('Upload returned no data'),
          }),
        );
      }

      return { key: data.key };
    }),

  getDownloadUrl: (key: string) =>
    Effect.gen(function* () {
      const tokenData = yield* Effect.tryPromise({
        try: () => parseUploadThingToken(),
        catch: (error) => new FileStorageError({ cause: error }),
      });

      if (!tokenData) {
        return yield* Effect.fail(
          new FileStorageError({
            cause: new Error('UploadThing token not configured'),
          }),
        );
      }

      return `https://${tokenData.appId}.ufs.sh/f/${key}`;
    }),
});

export function makeFrescoFileStorage(provider: StorageProvider) {
  return provider === 's3'
    ? S3NetworkExportersFileStorage
    : UploadThingNetworkExportersFileStorage;
}
