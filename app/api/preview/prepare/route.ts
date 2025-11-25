import { type NextRequest } from 'next/server';
import { generatePresignedUploadUrl } from '~/lib/uploadthing-presigned';
import { prisma } from '~/utils/db';
import { checkPreviewAuth, jsonResponse, OPTIONS } from '../helpers';

export { OPTIONS };

type AssetInput = {
  assetId: string;
  name: string;
  size: number;
  type: string;
};

type PrepareRequestBody = {
  assets: AssetInput[];
};

export async function POST(req: NextRequest) {
  const authError = await checkPreviewAuth(req);
  if (authError) return authError;

  try {
    const body = (await req.json()) as PrepareRequestBody;

    const { assets } = body;

    if (!assets || !Array.isArray(assets)) {
      return jsonResponse({ error: 'assets array is required' }, 400);
    }

    // Validate each asset has required fields
    for (const asset of assets) {
      if (!asset.assetId || !asset.name || !asset.size || !asset.type) {
        return jsonResponse(
          {
            error:
              'Each asset must have assetId, name, size, and type properties',
          },
          400,
        );
      }
    }

    // Check which assets already exist in the database
    const assetIds = assets.map((a) => a.assetId);
    const existingAssets = await prisma.asset.findMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
      select: {
        assetId: true,
        key: true,
        url: true,
        name: true,
        type: true,
        size: true,
      },
    });

    const existingAssetIds = new Set(existingAssets.map((a) => a.assetId));

    // Generate presigned URLs for new assets only
    const newAssets = assets.filter((a) => !existingAssetIds.has(a.assetId));

    const uploads: {
      assetId: string;
      uploadUrl: string;
      fileKey: string;
      fileUrl: string;
      expiresAt: number;
    }[] = [];

    for (const asset of newAssets) {
      const result = await generatePresignedUploadUrl({
        fileName: asset.name,
        fileSize: asset.size,
        fileType: getContentType(asset.type, asset.name),
      });

      if (!result) {
        return jsonResponse(
          {
            error:
              'Failed to generate presigned URL. UploadThing token may not be configured.',
          },
          500,
        );
      }

      uploads.push({
        assetId: asset.assetId,
        uploadUrl: result.uploadUrl,
        fileKey: result.fileKey,
        fileUrl: result.fileUrl,
        expiresAt: result.expiresAt,
      });
    }

    return jsonResponse({
      success: true,
      uploads,
      existing: existingAssets.map((a) => ({
        assetId: a.assetId,
        key: a.key,
        url: a.url,
        name: a.name,
        type: a.type,
        size: a.size,
      })),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error preparing preview assets:', error);

    return jsonResponse(
      {
        error: 'Failed to prepare preview assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
}

/**
 * Map Network Canvas asset types to content types
 */
function getContentType(assetType: string, fileName: string): string {
  // Get extension from filename
  const ext = fileName.split('.').pop()?.toLowerCase();

  // Map by NC asset type first
  switch (assetType) {
    case 'image':
      if (ext === 'png') return 'image/png';
      if (ext === 'gif') return 'image/gif';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'svg') return 'image/svg+xml';
      return 'image/jpeg';
    case 'video':
      if (ext === 'webm') return 'video/webm';
      if (ext === 'mov') return 'video/quicktime';
      return 'video/mp4';
    case 'audio':
      if (ext === 'wav') return 'audio/wav';
      if (ext === 'ogg') return 'audio/ogg';
      return 'audio/mpeg';
    case 'network':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
