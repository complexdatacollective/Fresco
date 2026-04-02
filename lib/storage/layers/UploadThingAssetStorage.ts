import { Effect, Layer } from 'effect';
import { AssetStorageError } from '~/lib/storage/errors';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import {
  generatePresignedUploadUrl,
  parseUploadThingToken,
  registerUploadWithUploadThing,
} from '~/lib/uploadthing/presigned';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { getBaseUrl } from '~/utils/getBaseUrl';

export const UploadThingAssetStorage = Layer.succeed(AssetStorage, {
  generatePresignedUploadUrls: (files) =>
    Effect.gen(function* () {
      const tokenData = yield* Effect.tryPromise({
        try: () => parseUploadThingToken(),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to read storage credentials.',
          }),
      });

      if (!tokenData) {
        return yield* Effect.fail(
          new AssetStorageError({
            cause: new Error('UploadThing token not configured'),
            userMessage: 'Storage credentials are not configured.',
          }),
        );
      }

      const results = files.map((file) => {
        const presigned = generatePresignedUploadUrl({
          fileName: file.name,
          fileSize: file.size,
          tokenData,
        });

        return {
          uploadUrl: presigned.uploadUrl,
          fileKey: presigned.fileKey,
          publicUrl: presigned.fileUrl,
        };
      });

      const fileKeys = results.map((r) => r.fileKey);
      const callbackUrl = `${getBaseUrl()}/api/uploadthing`;

      yield* Effect.tryPromise({
        try: () =>
          registerUploadWithUploadThing({
            fileKeys,
            tokenData,
            callbackUrl,
          }),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to register uploads with storage provider.',
          }),
      });

      return results;
    }),

  deleteAssets: (keys) =>
    Effect.gen(function* () {
      if (keys.length === 0) return;

      const utapi = yield* Effect.tryPromise({
        try: () => getUTApi(),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to connect to storage provider.',
          }),
      });

      const response = yield* Effect.tryPromise({
        try: () => utapi.deleteFiles(keys),
        catch: (error) =>
          new AssetStorageError({
            cause: error,
            userMessage: 'Failed to delete assets from storage.',
          }),
      });

      if (!response.success) {
        return yield* Effect.fail(
          new AssetStorageError({
            cause: new Error('Delete returned unsuccessful'),
            userMessage: 'Failed to delete assets from storage.',
          }),
        );
      }
    }),
});
