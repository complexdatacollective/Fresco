import { Layer } from 'effect';
import { env } from '~/env.js';
import { makeLocalFileStorage } from '~/lib/export/layers/LocalFileStorage';
import { NodeFileSystem } from '~/lib/export/layers/NodeFileSystem';
import { PrismaInterviewRepository } from '~/lib/export/layers/PrismaInterviewRepository';

const baseUrl = env.PUBLIC_URL ?? 'http://localhost:3000';

export const TestLayer = Layer.mergeAll(
  PrismaInterviewRepository,
  NodeFileSystem,
  makeLocalFileStorage(baseUrl),
);
