import {
  type CurrentProtocol,
  migrateProtocol,
  validateProtocol,
} from '@codaco/protocol-validation';
import { type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { env } from '~/env';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { generatePresignedUploadUrl } from '~/lib/uploadthing-presigned';
import { prisma } from '~/utils/db';
import { checkPreviewAuth, jsonResponse, OPTIONS } from './helpers';
import type {
  AbortResponse,
  CompleteResponse,
  InitializeResponse,
  PreviewRequest,
  ReadyResponse,
  RejectedResponse,
} from './types';

export { OPTIONS };

const REJECTED_RESPONSE: RejectedResponse = {
  status: 'rejected',
  message: 'Invalid protocol',
};

export async function POST(req: NextRequest) {
  const authError = await checkPreviewAuth(req);
  if (authError) return authError;

  try {
    const body = (await req.json()) as PreviewRequest;
    const { type } = body;

    switch (type) {
      case 'initialize-preview': {
        const { protocol: protocolJson, assetMeta, architectVersion } = body;

        // Check Architect version compatibility
        const [major] = architectVersion.split('.').map(Number);
        if (major && major < 7) {
          const response: InitializeResponse = {
            status: 'error',
            message:
              'Architect versions below 7.x are not supported for preview mode',
          };
          return jsonResponse(response, 400);
        }

        // Validate protocol object exists
        if (!protocolJson || typeof protocolJson !== 'object') {
          return jsonResponse(REJECTED_RESPONSE, 400);
        }

        // Check schema version
        const protocolVersion = protocolJson.schemaVersion;
        if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
          return jsonResponse(REJECTED_RESPONSE, 400);
        }

        // Migrate if needed
        const protocolToValidate = (
          protocolJson.schemaVersion < 8
            ? migrateProtocol(protocolJson, 8)
            : protocolJson
        ) as CurrentProtocol;

        // Validate protocol
        const validationResult = await validateProtocol(protocolToValidate);

        if (!validationResult.success) {
          return jsonResponse(REJECTED_RESPONSE, 400);
        }

        // Calculate protocol hash
        const protocolHash = hash(protocolJson);

        // Run pruning process before creating new protocol
        await prunePreviewProtocols();

        // Check if this exact protocol already exists as a preview
        const existingPreview = await prisma.protocol.findFirst({
          where: {
            hash: protocolHash,
            isPreview: true,
          },
          orderBy: {
            importedAt: 'desc',
          },
        });

        // If protocol exists, return ready immediately
        if (existingPreview) {
          // Update timestamp to prevent premature pruning
          await prisma.protocol.update({
            where: { id: existingPreview.id },
            data: { importedAt: new Date() },
          });

          const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
          url.pathname = `/preview/${existingPreview.id}`;

          const response: ReadyResponse = {
            status: 'ready',
            previewUrl: url.toString(),
          };
          return jsonResponse(response);
        }

        // Check which assets already exist in the database
        const assetIds = assetMeta.map((a) => a.assetId);
        const existingDbAssets = await prisma.asset.findMany({
          where: {
            assetId: { in: assetIds },
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

        // Get asset manifest from protocol to look up asset types
        const assetManifest = protocolToValidate.assetManifest ?? {};

        // Generate presigned URLs for assets that don't exist and prepare asset records
        const presignedUrls: string[] = [];
        const assetsToCreate: {
          assetId: string;
          key: string;
          name: string;
          type: string;
          url: string;
          size: number;
        }[] = [];
        const existingAssetIds: string[] = [];

        for (const asset of assetMeta) {
          const existingAsset = existingAssetMap.get(asset.assetId);

          if (existingAsset) {
            // Asset already exists - will connect it
            existingAssetIds.push(asset.assetId);
          } else {
            // Look up asset type from protocol's assetManifest
            const manifestEntry = assetManifest[asset.assetId];
            const assetType = manifestEntry?.type ?? 'file';

            // New asset - generate presigned URL and prepare asset record
            const presigned = await generatePresignedUploadUrl({
              fileName: asset.name,
              fileSize: asset.size,
            });

            if (!presigned) {
              const response: InitializeResponse = {
                status: 'error',
                message: 'Failed to generate presigned URL',
              };
              return jsonResponse(response, 500);
            }

            presignedUrls.push(presigned.uploadUrl);
            assetsToCreate.push({
              assetId: asset.assetId,
              key: presigned.fileKey,
              name: asset.name,
              type: assetType,
              url: presigned.fileUrl,
              size: asset.size,
            });
          }
        }

        // Create the protocol with assets immediately
        const protocol = await prisma.protocol.create({
          data: {
            hash: protocolHash,
            name: `preview-${Date.now()}`,
            schemaVersion: protocolJson.schemaVersion,
            description: protocolJson.description,
            lastModified: protocolJson.lastModified
              ? new Date(protocolJson.lastModified)
              : new Date(),
            stages: protocolJson.stages as never,
            codebook: protocolJson.codebook as never,
            isPreview: true,
            assets: {
              create: assetsToCreate,
              connect: existingAssetIds.map((assetId) => ({ assetId })),
            },
          },
        });

        void addEvent(
          'Preview Protocol Uploaded',
          `Preview protocol "${protocol.name}" initialized`,
        );

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

        // Update timestamp to mark completion
        await prisma.protocol.update({
          where: { id: protocol.id },
          data: { importedAt: new Date() },
        });

        void addEvent(
          'Preview Protocol Uploaded',
          `Preview protocol "${protocol.name}" completed`,
        );

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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Preview request error:', error);

    return jsonResponse(
      {
        status: 'error',
        message: 'Failed to process preview request',
      },
      500,
    );
  }
}
