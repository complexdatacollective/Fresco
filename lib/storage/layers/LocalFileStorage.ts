import { createWriteStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Effect, Layer } from 'effect';
import { FileStorageError, getUserMessage } from '~/lib/storage/errors';
import { FileStorage } from '~/lib/storage/services/FileStorage';
import { FileStorageError as PackageFileStorageError } from '~/lib/network-exporters/errors';
import { FileStorage as PackageFileStorage } from '~/lib/network-exporters/services/FileStorage';

const LOCAL_EXPORT_DIR = join(tmpdir(), 'fresco-test-exports');

export const makeLocalFileStorage = (baseUrl: string) =>
  Layer.succeed(FileStorage, {
    upload: (fileBuffer, fileName) =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () => mkdir(LOCAL_EXPORT_DIR, { recursive: true }),
          catch: (error) =>
            new FileStorageError({
              cause: error,
              userMessage: getUserMessage(error, 'preparing local storage'),
            }),
        });

        const filePath = join(LOCAL_EXPORT_DIR, fileName);

        yield* Effect.tryPromise({
          try: () => writeFile(filePath, fileBuffer),
          catch: (error) =>
            new FileStorageError({
              cause: error,
              userMessage: getUserMessage(error, 'writing to local storage'),
            }),
        });

        return {
          url: `${baseUrl}/api/test/exports/${fileName}`,
          key: fileName,
        };
      }),

    delete: (key) => {
      if (!/^networkCanvasExport-\d+\.zip$/.test(key)) {
        return Effect.fail(
          new FileStorageError({
            cause: new Error(`Invalid key: ${key}`),
            userMessage: 'Failed to delete file: invalid key.',
          }),
        );
      }

      return Effect.tryPromise({
        try: () => unlink(join(LOCAL_EXPORT_DIR, key)),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'deleting from local storage'),
          }),
      });
    },

    getDownloadUrl: (key) =>
      Effect.succeed(`${baseUrl}/api/test/exports/${key}`),
  });

export { LOCAL_EXPORT_DIR };

export const makeLocalNetworkExportersFileStorage = (baseUrl: string) =>
  Layer.succeed(PackageFileStorage, {
    upload: (stream, fileName) =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () => mkdir(LOCAL_EXPORT_DIR, { recursive: true }),
          catch: (error) => new PackageFileStorageError({ cause: error }),
        });

        const filePath = join(LOCAL_EXPORT_DIR, fileName);

        yield* Effect.tryPromise({
          try: () => pipeline(stream, createWriteStream(filePath)),
          catch: (error) => new PackageFileStorageError({ cause: error }),
        });

        return { key: fileName };
      }),

    getDownloadUrl: (key) =>
      Effect.succeed(`${baseUrl}/api/test/exports/${key}`),
  });
