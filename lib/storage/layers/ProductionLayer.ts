import { Layer } from 'effect';
import { NodeFileSystem } from '~/lib/network-exporters/layers/NodeFileSystem';
import { PrismaInterviewRepository } from '~/lib/network-exporters/layers/PrismaInterviewRepository';
import { UploadThingAssetStorage } from '~/lib/storage/layers/UploadThingAssetStorage';
import { UploadThingFileStorage } from '~/lib/storage/layers/UploadThingFileStorage';
import { S3AssetStorage } from '~/lib/storage/layers/S3AssetStorage';
import { S3FileStorage } from '~/lib/storage/layers/S3FileStorage';
import type { StorageProvider } from '~/queries/storageProvider';

export function makeProductionLayer(provider: StorageProvider) {
  const storageLayers =
    provider === 's3'
      ? Layer.mergeAll(S3FileStorage, S3AssetStorage)
      : Layer.mergeAll(UploadThingFileStorage, UploadThingAssetStorage);

  return Layer.mergeAll(
    PrismaInterviewRepository,
    NodeFileSystem,
    storageLayers,
  );
}
