import { Layer } from 'effect';
import { NodeFileSystem } from '~/lib/export/layers/NodeFileSystem';
import { PrismaInterviewRepository } from '~/lib/export/layers/PrismaInterviewRepository';
import { UploadThingFileStorage } from '~/lib/export/layers/UploadThingFileStorage';

export const ProductionLayer = Layer.mergeAll(
  PrismaInterviewRepository,
  NodeFileSystem,
  UploadThingFileStorage,
);
