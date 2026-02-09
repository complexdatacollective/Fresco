import { NextResponse, type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { env } from '~/env';
import { MIN_ARCHITECT_VERSION_FOR_PREVIEW } from '~/fresco.config';
import trackEvent from '~/lib/analytics';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { validateAndMigrateProtocol } from '~/lib/protocol/validateAndMigrateProtocol';
import {
  generatePresignedUploadUrl,
  parseUploadThingToken,
} from '~/lib/uploadthing/presigned';
import { getExistingAssets } from '~/queries/protocols';
import { ensureError } from '~/utils/ensureError';
import { extractApikeyAssetsFromManifest } from '~/utils/protocolImport';
import { compareSemver, semverSchema } from '~/utils/semVer';
import { checkPreviewAuth, corsHeaders, jsonResponse } from './helpers';
import type {
  AbortResponse,
  CompleteResponse,
  InitializeResponse,
  PreviewRequest,
  PreviewResponse,
  ReadyResponse,
  RejectedResponse,
} from './types';

// Handle preflight OPTIONS request
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<PreviewResponse>> {
  const authError = await checkPreviewAuth(req);

  if (authError) {
    return jsonResponse(authError.response, authError.status);
  }

  const REJECTED_RESPONSE: RejectedResponse = {
    status: 'rejected',
    message: 'Invalid protocol',
  };

  try {
    const body = (await req.json()) as PreviewRequest;
    const { type } = body;

    switch (type) {
      case 'initialize-preview': {
        const { protocol: protocolJson, assetMeta, architectVersion } = body;

        // Check Architect version compatibility
        const architectVer = semverSchema.parse(`v${architectVersion}`);
        const minVer = semverSchema.parse(
          `v${MIN_ARCHITECT_VERSION_FOR_PREVIEW}`,
        );
        if (compareSemver(architectVer, minVer) < 0) {
          const response: InitializeResponse = {
            status: 'error',
            message: `Architect versions below ${MIN_ARCHITECT_VERSION_FOR_PREVIEW} are not supported for preview mode`,
          };
          return jsonResponse(response, 400);
        }

        // Validate and migrate protocol
        const validationResult = await validateAndMigrateProtocol(protocolJson);

        if (!validationResult.success) {
          return jsonResponse(REJECTED_RESPONSE, 400);
        }

        const protocolToValidate = validationResult.protocol;

        // Calculate protocol hash
        const protocolHash = hash(protocolJson);

        // Prune existing preview protocols based on age limit
        // - Pending protocols (abandoned uploads) are deleted after 15 minutes
        // - Completed protocols are deleted after 24 hours
        // Ensures that we dont accumulate old preview protocols
        await prunePreviewProtocols();

        // Check if this exact protocol already exists
        const existingPreview = await prisma.protocol.findFirst({
          where: {
            hash: protocolHash,
          },
        });

        // If protocol exists, return ready immediately
        if (existingPreview) {
          const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
          url.pathname = `/preview/${existingPreview.id}`;

          const response: ReadyResponse = {
            status: 'ready',
            previewUrl: url.toString(),
          };
          return jsonResponse(response);
        }
        const assetManifest = protocolToValidate.assetManifest ?? {};

        // Extract apikey assets from the manifest — they store a value
        const apikeyAssets = extractApikeyAssetsFromManifest(assetManifest);

        const allAssetIds = [
          ...assetMeta.map((a) => a.assetId),
          ...apikeyAssets.map((a) => a.assetId),
        ];
        const existingDbAssets = await getExistingAssets(allAssetIds);
        const existingAssetIdSet = new Set(
          existingDbAssets.map((a) => a.assetId),
        );

        const existingAssetIds = allAssetIds.filter((id) =>
          existingAssetIdSet.has(id),
        );
        const newApikeyAssets = apikeyAssets.filter(
          (a) => !existingAssetIdSet.has(a.assetId),
        );
        const newAssets = assetMeta.filter(
          (a) => !existingAssetIdSet.has(a.assetId),
        );

        const tokenData = await parseUploadThingToken();

        if (newAssets.length > 0 && !tokenData) {
          const response: InitializeResponse = {
            status: 'error',
            message: 'UploadThing not configured',
          };
          return jsonResponse(response, 500);
        }

        const presignedData = newAssets.map((asset) => {
          const manifestEntry = assetManifest[asset.assetId];
          const assetType = manifestEntry?.type ?? 'file';

          const presigned = generatePresignedUploadUrl({
            fileName: asset.name,
            fileSize: asset.size,
            tokenData: tokenData!,
          });

          if (!presigned) {
            throw new Error('Failed to generate presigned URL');
          }

          return {
            uploadUrl: presigned.uploadUrl,
            assetRecord: {
              assetId: asset.assetId,
              key: presigned.fileKey,
              name: asset.name,
              type: assetType,
              url: presigned.fileUrl,
              size: asset.size,
            },
          };
        });

        const presignedUrls = presignedData.map((d) => d.uploadUrl);
        const assetsToCreate = presignedData.map((d) => d.assetRecord);

        // Create the protocol with assets immediately
        // Mark as pending if there are assets to upload
        const protocol = await prisma.protocol.create({
          data: {
            hash: protocolHash,
            name: `preview-${Date.now()}`,
            schemaVersion: protocolToValidate.schemaVersion,
            description: protocolToValidate.description,
            lastModified: protocolToValidate.lastModified
              ? new Date(protocolToValidate.lastModified)
              : new Date(),
            stages: protocolToValidate.stages,
            codebook: protocolToValidate.codebook,
            experiments: protocolToValidate.experiments ?? Prisma.JsonNull,
            isPreview: true,
            isPending: presignedUrls.length > 0,
            assets: {
              create: [...assetsToCreate, ...newApikeyAssets],
              connect: existingAssetIds.map((assetId) => ({ assetId })),
            },
          },
        });

        void addEvent('Preview Mode', `Preview protocol upload initiated`);

        // If no new assets to upload, return ready immediately
        if (presignedUrls.length === 0) {
          const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
          url.pathname = `/preview/${protocol.id}`;

          const response: InitializeResponse = {
            status: 'ready',
            previewUrl: url.toString(),
          };
          return jsonResponse(response);
        }

        const response: InitializeResponse = {
          status: 'job-created',
          protocolId: protocol.id,
          presignedUrls,
        };
        return jsonResponse(response);
      }

      case 'complete-preview': {
        const { protocolId } = body;

        // Find the protocol
        const protocol = await prisma.protocol.findUnique({
          where: { id: protocolId },
        });

        if (!protocol) {
          const response: CompleteResponse = {
            status: 'error',
            message: 'Preview job not found',
          };
          return jsonResponse(response, 404);
        }

        // Update timestamp and clear pending flag to mark completion
        await prisma.protocol.update({
          where: { id: protocol.id },
          data: { importedAt: new Date(), isPending: false },
        });

        void addEvent('Preview Mode', `Preview protocol upload completed`);

        const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
        url.pathname = `/preview/${protocol.id}`;

        const response: CompleteResponse = {
          status: 'ready',
          previewUrl: url.toString(),
        };
        return jsonResponse(response);
      }

      case 'abort-preview': {
        const { protocolId } = body;

        // Find and delete the protocol
        const protocol = await prisma.protocol.findUnique({
          where: { id: protocolId },
        });

        if (!protocol) {
          const response: AbortResponse = {
            status: 'error',
            message: 'Preview job not found',
          };
          return jsonResponse(response, 404);
        }

        // Delete the protocol (cascades to related entities)
        await prisma.protocol.delete({
          where: { id: protocolId },
        });

        void addEvent(
          'Protocol Uninstalled',
          `Preview protocol "${protocol.name}" was aborted and removed`,
        );

        const response: AbortResponse = {
          status: 'removed',
          protocolId: protocolId,
        };
        return jsonResponse(response);
      }
    }
  } catch (e) {
    const error = ensureError(e);
    void trackEvent({
      type: 'Error',
      message: error.message,
      name: 'Preview API Error',
    });

    return jsonResponse(
      {
        status: 'error',
        message: 'Failed to process preview request',
      },
      500,
    );
  }
}
