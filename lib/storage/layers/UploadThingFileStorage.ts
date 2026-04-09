import { File } from 'node:buffer';
import { Effect, Layer } from 'effect';
import { FileStorageError, getUserMessage } from '~/lib/storage/errors';
import { FileStorage } from '~/lib/storage/services/FileStorage';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { getAppSetting } from '~/queries/appSettings';

type ParsedToken = {
  apiKey: string;
  appId: string;
  regions: string[];
  ingestHost: string;
};

async function parseUploadThingToken(): Promise<ParsedToken | null> {
  const token = await getAppSetting('uploadThingToken');

  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as ParsedToken;

    return {
      apiKey: parsed.apiKey,
      appId: parsed.appId,
      regions: parsed.regions,
      ingestHost: parsed.ingestHost ?? 'ingest.uploadthing.com',
    };
  } catch {
    return null;
  }
}

export const UploadThingFileStorage = Layer.succeed(FileStorage, {
  upload: (fileBuffer, fileName) =>
    Effect.gen(function* () {
      const utapi = yield* Effect.tryPromise({
        try: () => getUTApi(),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'retrieving file storage credentials',
            ),
          }),
      });

      const zipFile = new File([fileBuffer], fileName, {
        type: 'application/zip',
      });

      const { data, error } = yield* Effect.tryPromise({
        try: () => utapi.uploadFiles(zipFile),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'uploading zip file'),
          }),
      });

      if (!data) {
        return yield* Effect.fail(
          new FileStorageError({
            cause: error ?? new Error('Upload returned no data'),
            userMessage: getUserMessage(
              error ?? new Error('Upload returned no data'),
              'uploading zip file',
            ),
          }),
        );
      }

      return { url: data.ufsUrl, key: data.key };
    }),

  delete: (key) =>
    Effect.gen(function* () {
      const utapi = yield* Effect.tryPromise({
        try: () => getUTApi(),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'retrieving file storage credentials',
            ),
          }),
      });

      const response = yield* Effect.tryPromise({
        try: () => utapi.deleteFiles(key),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(
              error,
              'deleting file from file storage',
            ),
          }),
      });

      if (!response.success) {
        return yield* Effect.fail(
          new FileStorageError({
            cause: new Error('Delete returned unsuccessful'),
            userMessage: 'Failed to delete the zip file from file storage.',
          }),
        );
      }
    }),

  getDownloadUrl: (key) =>
    Effect.gen(function* () {
      const tokenData = yield* Effect.tryPromise({
        try: () => parseUploadThingToken(),
        catch: (error) =>
          new FileStorageError({
            cause: error,
            userMessage: getUserMessage(error, 'parsing storage credentials'),
          }),
      });

      if (!tokenData) {
        return yield* Effect.fail(
          new FileStorageError({
            cause: new Error('UploadThing token not configured'),
            userMessage: 'Storage credentials are not configured.',
          }),
        );
      }

      return `https://${tokenData.appId}.ufs.sh/f/${key}`;
    }),
});
