import type { Codebook } from './codebook.js';
import type { Stage } from './stages.js';

export interface AssetDefinition {
  source: string;
  name: string;
  type: 'network' | 'image' | 'audio' | 'video';
  id?: string;
}

export interface AssetManifest {
  [key: string]: AssetDefinition;
}

export interface Protocol {
  name: string;
  description?: string;
  lastModified: string;
  schemaVersion: number;
  stages: Stage[];
  codebook: Codebook;
  assetManifest?: AssetManifest;
}
