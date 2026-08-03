import { Effect, Layer } from 'effect';
import { AssetStorageError } from '~/lib/storage/errors';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import { getUTApi } from '~/lib/uploadthing/server-helpers';

export const UploadThingAssetStorage = Layer.succeed(AssetStorage, {
  // UploadThing's ingest protocol is not a plain presigned-PUT; clients must
  // use the UploadThing SDK's uploader directly (which hits /api/uploadthing).
  // Callers should check the storage provider and route around this method.
  generatePresignedUploadUrls: () =>
    Effect.fail(
      new AssetStorageError({
        cause: new Error(
          'generatePresignedUploadUrls is not supported for UploadThing — use the UploadThing SDK client uploader instead.',
        ),
        userMessage: 'Upload flow misconfigured for UploadThing.',
      }),
    ),

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
