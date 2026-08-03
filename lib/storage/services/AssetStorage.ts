import { Context, type Effect } from 'effect';
import type { AssetStorageError } from '~/lib/storage/errors';

export type PresignedUploadUrl = {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
};

export class AssetStorage extends Context.Tag('AssetStorage')<
  AssetStorage,
  {
    readonly generatePresignedUploadUrls: (
      files: { name: string; size: number }[],
    ) => Effect.Effect<PresignedUploadUrl[], AssetStorageError>;
    readonly deleteAssets: (
      keys: string[],
    ) => Effect.Effect<void, AssetStorageError>;
  }
>() {}
