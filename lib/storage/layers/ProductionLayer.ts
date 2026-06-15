import { S3AssetStorage } from '~/lib/storage/layers/S3AssetStorage';
import { UploadThingAssetStorage } from '~/lib/storage/layers/UploadThingAssetStorage';
import type { StorageProvider } from '~/queries/storageProvider';

export function makeProductionLayer(provider: StorageProvider) {
  return provider === 's3' ? S3AssetStorage : UploadThingAssetStorage;
}
