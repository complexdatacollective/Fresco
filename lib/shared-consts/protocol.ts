import type { Codebook } from "./codebook.js";
import type { Stage } from "./stages.js";

export interface Protocol {
  name: string;
  description?: string;
  lastModified: string;
  schemaVersion: number;
  stages: Stage[];
  codebook: Codebook;
  assetManifest?: Record<string, unknown>;
}
