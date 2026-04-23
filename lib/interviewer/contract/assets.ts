import type { ResolvedAsset } from '~/lib/interviewer/contract/types';

const validAssetTypes = [
  'image',
  'video',
  'audio',
  'network',
  'geojson',
  'apikey',
] as const satisfies readonly ResolvedAsset['type'][];

export function isValidAssetType(
  type: string,
): type is ResolvedAsset['type'] {
  return (validAssetTypes as readonly string[]).includes(type);
}
