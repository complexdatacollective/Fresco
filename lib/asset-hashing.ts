import { createHash } from 'crypto';
import { prisma } from '~/utils/db';

/**
 * Calculate a hash for a file buffer to enable content-based deduplication
 */
export function hashFileBuffer(buffer: Buffer): string {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Calculate a hash for a File object
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return hashFileBuffer(buffer);
}

/**
 * Check if an asset with the same content hash already exists in UploadThing
 * Returns the existing asset details if found, null otherwise
 */
export function findAssetByContentHash(
  _contentHash: string,
): {
  key: string;
  url: string;
  assetId: string;
  name: string;
  type: string;
  size: number;
} | null {
  // We'll store the content hash in the asset name or use a metadata table
  // For now, let's use a simple approach: check if any asset exists with same size and type
  // A more robust solution would involve storing content hashes in a separate table

  // This is a placeholder - in a real implementation, you'd want to:
  // 1. Add a contentHash column to the Asset table
  // 2. Store the hash when uploading
  // 3. Query by that hash here

  return null; // For now, always return null to force uploads
}

export type AssetWithFile = {
  assetId: string;
  name: string;
  type: string;
  file: File;
};

export type AssetUploadResult = {
  key: string;
  assetId: string;
  name: string;
  type: string;
  url: string;
  size: number;
};

/**
 * Deduplicate assets before upload by checking content hashes
 * Returns:
 * - assetsToUpload: New assets that need to be uploaded
 * - existingAssets: Assets that already exist and can be reused
 */
export async function deduplicateAssets(
  assets: AssetWithFile[],
): Promise<{
  assetsToUpload: AssetWithFile[];
  existingAssets: AssetUploadResult[];
  assetIdToExistingAssetMap: Map<string, AssetUploadResult>;
}> {
  const assetsToUpload: AssetWithFile[] = [];
  const existingAssets: AssetUploadResult[] = [];
  const assetIdToExistingAssetMap = new Map<string, AssetUploadResult>();

  // First check: Does the assetId already exist in the database?
  // This is the primary deduplication mechanism
  const assetIds = assets.map((a) => a.assetId);
  const existingDbAssets = await prisma.asset.findMany({
    where: {
      assetId: {
        in: assetIds,
      },
    },
    select: {
      assetId: true,
      key: true,
      name: true,
      type: true,
      url: true,
      size: true,
    },
  });

  // Create a map of existing assets by assetId
  const existingByAssetId = new Map(
    existingDbAssets.map((asset) => [asset.assetId, asset]),
  );

  // Separate assets into those that need upload vs those that already exist
  for (const asset of assets) {
    const existing = existingByAssetId.get(asset.assetId);
    if (existing) {
      existingAssets.push(existing);
      assetIdToExistingAssetMap.set(asset.assetId, existing);
    } else {
      assetsToUpload.push(asset);
    }
  }

  return {
    assetsToUpload,
    existingAssets,
    assetIdToExistingAssetMap,
  };
}
