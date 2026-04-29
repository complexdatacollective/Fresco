import { hash } from 'ohash';

/**
 * Compute the dedup hash for a protocol from its structural definition only
 * (codebook + stages). Metadata fields — name, description, lastModified,
 * assetManifest, experiments — are excluded so that two protocols with the
 * same interview structure are treated as duplicates regardless of cosmetic
 * differences or asset variations.
 *
 * Used by the import flow (duplicate detection) and the v7→v8 migration
 * (recomputing Protocol.hash). Both must call this so hashes stay
 * comparable across import/migrate cycles.
 */
export function hashProtocol(protocol: {
  codebook: unknown;
  stages: unknown;
}): string {
  return hash({ codebook: protocol.codebook, stages: protocol.stages });
}
