import { Layer } from 'effect';
import { S3AssetStorage } from '~/lib/storage/layers/S3AssetStorage';
import { S3FileStorage } from '~/lib/storage/layers/S3FileStorage';
import { UploadThingAssetStorage } from '~/lib/storage/layers/UploadThingAssetStorage';
import { UploadThingFileStorage } from '~/lib/storage/layers/UploadThingFileStorage';
import type { StorageProvider } from '~/queries/storageProvider';

export function makeProductionLayer(provider: StorageProvider) {
  return provider === 's3'
    ? Layer.mergeAll(S3FileStorage, S3AssetStorage)
    : Layer.mergeAll(UploadThingFileStorage, UploadThingAssetStorage);
}
