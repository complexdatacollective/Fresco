import type { Asset } from '@prisma/client';
import type { Codebook } from './codebook.js';
import type { Stage } from './stages.js';

export type AssetDefinition = {
  source: string;
  name: string;
  type: 'network' | 'image' | 'audio' | 'video';
  id?: string;
};

export type AssetManifest = Record<string, AssetDefinition>;

export type Protocol = {
  name: string;
  description?: string;
  lastModified: string;
  schemaVersion: number;
  stages: Stage[];
  codebook: Codebook;
  assets: Asset[];
};
