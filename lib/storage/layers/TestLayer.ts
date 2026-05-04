import { Effect, Layer } from 'effect';
import { env } from '~/env.js';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import { makeLocalFileStorage } from '~/lib/storage/layers/LocalFileStorage';

const baseUrl = env.PUBLIC_URL ?? 'http://localhost:3000';

const TestAssetStorage = Layer.succeed(AssetStorage, {
  generatePresignedUploadUrls: () => Effect.succeed([]),
  deleteAssets: () => Effect.void,
});

export const TestLayer = Layer.mergeAll(
  makeLocalFileStorage(baseUrl),
  TestAssetStorage,
);
