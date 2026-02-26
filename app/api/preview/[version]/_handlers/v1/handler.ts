import { type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { env } from '~/env';
import trackEvent from '~/lib/analytics';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { validateAndMigrateProtocol } from '~/lib/protocol/validateAndMigrateProtocol';
import {
  generatePresignedUploadUrl,
  parseUploadThingToken,
  registerUploadWithUploadThing,
} from '~/lib/uploadthing/presigned';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { getExistingAssets } from '~/queries/protocols';
import { ensureError } from '~/utils/ensureError';
import { extractApikeyAssetsFromManifest } from '~/utils/protocolImport';
import { checkPreviewAuth, jsonResponse } from './helpers';
import {
  type AbortResponse,
  type CompleteResponse,
  type InitializeResponse,
  type PreviewRequest,
  type ReadyResponse,
  type RejectedResponse,
} from './types';

export async function v1(request: NextRequest) {
  const authError = await checkPreviewAuth(request);

  if (authError) {
    return jsonResponse(authError.response, authError.status);
  }

  const REJECTED_RESPONSE: RejectedResponse = {
    status: 'rejected',
    message: 'Invalid protocol',
  };

  try {
    const body = (await request.json()) as PreviewRequest;
    const { type } = body;

    switch (type) {
      case 'initialize-preview': {
        const { protocol: protocolJson, assetMeta } = body;

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
          const url = new URL(env.PUBLIC_URL ?? request.nextUrl.clone());
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
        const fileKeys = presignedData.map((d) => d.assetRecord.key);
        const assetsToCreate = presignedData.map((d) => d.assetRecord);

        // Register the uploads with UploadThing to enable CORS for browser uploads
        if (fileKeys.length > 0) {
          const callbackUrl = `${env.PUBLIC_URL ?? request.nextUrl.origin}/api/uploadthing`;
          await registerUploadWithUploadThing({
            fileKeys,
            tokenData: tokenData!,
            callbackUrl,
          });
        }

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
          const url = new URL(env.PUBLIC_URL ?? request.nextUrl.clone());
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

        const url = new URL(env.PUBLIC_URL ?? request.nextUrl.clone());
        url.pathname = `/preview/${protocol.id}`;

        const response: CompleteResponse = {
          status: 'ready',
          previewUrl: url.toString(),
        };
        return jsonResponse(response);
      }

      case 'abort-preview': {
        const { protocolId } = body;

        // Find the protocol
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

        // Find assets that are ONLY associated with this protocol
        // Note: `every` alone would match orphaned assets (with no protocols),
        // so we also require `some` to ensure the asset is actually linked to this protocol
        const assetsToDelete = await prisma.asset.findMany({
          where: {
            AND: [
              { protocols: { some: { id: protocolId } } },
              { protocols: { every: { id: protocolId } } },
            ],
          },
          select: { key: true },
        });

        // Delete assets from UploadThing (best effort)
        if (assetsToDelete.length > 0) {
          try {
            const utapi = await getUTApi();
            await utapi.deleteFiles(assetsToDelete.map((a) => a.key));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error deleting preview protocol assets:', error);
          }
        }

        // Delete assets from database
        if (assetsToDelete.length > 0) {
          await prisma.asset.deleteMany({
            where: {
              key: {
                in: assetsToDelete.map((a) => a.key),
              },
            },
          });
        }

        // Delete the protocol
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
