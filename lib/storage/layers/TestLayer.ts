import { Effect, Layer } from 'effect';
import { env } from '~/env.js';
import { NodeFileSystem } from '~/lib/exportLayers/NodeFileSystem';
import { PrismaInterviewRepository } from '~/lib/exportLayers/PrismaInterviewRepository';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import {
  makeLocalFileStorage,
  makeLocalNetworkExportersFileStorage,
} from '~/lib/storage/layers/LocalFileStorage';

const baseUrl = env.PUBLIC_URL ?? 'http://localhost:3000';

const TestAssetStorage = Layer.succeed(AssetStorage, {
  generatePresignedUploadUrls: () => Effect.succeed([]),
  deleteAssets: () => Effect.void,
});

export const TestLayer = Layer.mergeAll(
  PrismaInterviewRepository,
  NodeFileSystem,
  makeLocalFileStorage(baseUrl),
  makeLocalNetworkExportersFileStorage(baseUrl),
  TestAssetStorage,
);
