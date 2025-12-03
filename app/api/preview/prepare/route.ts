import { type NextRequest } from 'next/server';
import { generatePresignedUploadUrl } from '~/lib/uploadthing-presigned';
import { prisma } from '~/utils/db';
import { checkPreviewAuth, jsonResponse, OPTIONS } from '../helpers';

export { OPTIONS };

type AssetInput = {
  assetId: string;
  name: string;
  size: number;
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

    // Validate asset structure
    for (const asset of assets) {
      if (!asset.assetId || !asset.name || typeof asset.size !== 'number') {
        return jsonResponse(
          { error: 'Each asset must have assetId, name, and size' },
          400,
        );
      }
    }

    // Check which assets already exist in the database
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
        url: true,
      },
    });

    const existingAssetMap = new Map(
      existingDbAssets.map((a) => [a.assetId, { key: a.key, url: a.url }]),
    );

    // Build response: existing assets and new uploads
    const existing: {
      assetId: string;
      fileKey: string;
      fileUrl: string;
    }[] = [];

    const uploads: {
      assetId: string;
      uploadUrl: string;
      fileKey: string;
      fileUrl: string;
      expiresAt: number;
    }[] = [];

    for (const asset of assets) {
      const existingAsset = existingAssetMap.get(asset.assetId);

      if (existingAsset) {
        // Asset already exists - no upload needed
        existing.push({
          assetId: asset.assetId,
          fileKey: existingAsset.key,
          fileUrl: existingAsset.url,
        });
      } else {
        // New asset - generate presigned URL
        const presigned = await generatePresignedUploadUrl({
          fileName: asset.name,
          fileSize: asset.size,
        });

        if (!presigned) {
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
          uploadUrl: presigned.uploadUrl,
          fileKey: presigned.fileKey,
          fileUrl: presigned.fileUrl,
          expiresAt: presigned.expiresAt,
        });
      }
    }

    return jsonResponse({
      success: true,
      existing,
      uploads,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: 'Failed to prepare upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
}
