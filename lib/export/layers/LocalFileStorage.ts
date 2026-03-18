import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect, Layer } from 'effect';
import { FileStorageError, getUserMessage } from '~/lib/export/errors';
import { FileStorage } from '~/lib/export/services/FileStorage';

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

    delete: (key) =>
      Effect.tryPromise({
        try: () => unlink(join(LOCAL_EXPORT_DIR, key)),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'deleting from local storage'),
          }),
      }),
  });

export { LOCAL_EXPORT_DIR };
