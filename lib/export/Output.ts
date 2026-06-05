import { type Layer } from 'effect';
import { makeZipOutput } from '@codaco/network-exporters/layers/ZipOutput';
import type { Output } from '@codaco/network-exporters/services/Output';
import { makeS3Sink } from '~/lib/storage/layers/S3FileStorage';
import { makeUploadThingSink } from '~/lib/storage/layers/UploadThingFileStorage';
import type { StorageProvider } from '~/queries/storageProvider';

export const makeProductionOutputLayer = (
  provider: StorageProvider,
): Layer.Layer<Output> =>
  makeZipOutput(provider === 's3' ? makeS3Sink : makeUploadThingSink);
