import { Effect } from 'effect';
import { after, type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { prunePreviewProtocols } from '~/actions/preview-protocol-pruning';
import { env } from '~/env';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { validateAndMigrateProtocol } from '~/lib/protocol/validateAndMigrateProtocol';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import {
  AssetStorage,
  type PresignedUploadUrl,
} from '~/lib/storage/services/AssetStorage';
import {
  generatePresignedUploadUrl,
  registerUploadWithUploadThing,
} from '~/lib/uploadthing/presigned';
import { parseUploadThingToken } from '~/lib/uploadthing/token';
import { getExistingAssets } from '~/queries/protocols';
import { getStorageProvider } from '~/queries/storageProvider';
import { ensureError } from '~/utils/ensureError';
import { getBaseUrl } from '~/utils/getBaseUrl';
import { extractApikeyAssetsFromManifest } from '~/utils/protocolImport';
import { checkPreviewAuth, jsonResponse } from './helpers';
import {
  type AbortResponse,
  type CompleteResponse,
  type InitializeResponse,
  type PresignedUrlWithAssetId,
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

        // Check if this exact preview protocol already exists
        const existingPreview = await prisma.previewProtocol.findFirst({
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

        // Both storage providers pre-compute a presigned upload URL per
        // asset. The client (Architect) PUTs directly to the storage
        // provider, bypassing our own server — this keeps us off the
        // Netlify 4.5MB function-payload cap that made the old proxy model
        // unusable for large videos.
        const provider =
          newAssets.length > 0 ? await getStorageProvider() : null;

        let presigned: PresignedUploadUrl[] = [];

        if (provider === 's3') {
          const storageLayer = await getStorageLayer();
          presigned = await Effect.gen(function* () {
            const assetStorage = yield* AssetStorage;
            return yield* assetStorage.generatePresignedUploadUrls(
              newAssets.map((a) => ({ name: a.name, size: a.size })),
            );
          }).pipe(Effect.provide(storageLayer), Effect.runPromise);
        } else if (provider === 'uploadthing') {
          const tokenData = await parseUploadThingToken();
          if (!tokenData) {
            const errorResponse: InitializeResponse = {
              status: 'error',
              message: 'UploadThing is not configured',
            };
            return jsonResponse(errorResponse, 500);
          }

          presigned = newAssets.map((asset) =>
            generatePresignedUploadUrl({
              fileName: asset.name,
              fileSize: asset.size,
              tokenData,
            }),
          );

          // Required for UploadThing to accept CORS preflight on the PUT
          // from external clients. No-op for the actual storage result.
          await registerUploadWithUploadThing({
            fileKeys: presigned.map((p) => p.fileKey),
            tokenData,
            callbackUrl: `${getBaseUrl()}/api/uploadthing`,
          });
        }

        const assetsToCreate = presigned.map((entry, i) => {
          const asset = newAssets[i]!;
          const manifestEntry = assetManifest[asset.assetId];
          return {
            assetId: asset.assetId,
            key: entry.fileKey,
            name: asset.name,
            type: manifestEntry?.type ?? 'file',
            url: entry.publicUrl,
            size: asset.size,
          };
        });

        const protocol = await prisma.previewProtocol.create({
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
            isPending: newAssets.length > 0,
            assets: {
              create: [...assetsToCreate, ...newApikeyAssets],
              connect: existingAssetIds.map((assetId) => ({ assetId })),
            },
          },
        });

        void addEvent('Preview Mode', `Preview protocol upload initiated`);

        if (newAssets.length === 0) {
          const url = new URL(env.PUBLIC_URL ?? request.nextUrl.clone());
          url.pathname = `/preview/${protocol.id}`;

          const response: InitializeResponse = {
            status: 'ready',
            previewUrl: url.toString(),
          };
          return jsonResponse(response);
        }

        // UploadThing's ingest endpoint only accepts multipart/form-data;
        // S3 presigned PUTs take the file as the raw request body.
        const bodyFormat: 'raw' | 'formdata' =
          provider === 'uploadthing' ? 'formdata' : 'raw';

        const presignedUrls: PresignedUrlWithAssetId[] = newAssets.map(
          (asset, i) => ({
            assetId: asset.assetId,
            url: presigned[i]!.uploadUrl,
            headers: {},
            bodyFormat,
          }),
        );

        const response: InitializeResponse = {
          status: 'job-created',
          protocolId: protocol.id,
          presignedUrls,
        };
        return jsonResponse(response);
      }

      case 'complete-preview': {
        const { protocolId } = body;

        // Find the preview protocol
        const protocol = await prisma.previewProtocol.findUnique({
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
        await prisma.previewProtocol.update({
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

        // Find the preview protocol
        const protocol = await prisma.previewProtocol.findUnique({
          where: { id: protocolId },
        });

        if (!protocol) {
          const response: AbortResponse = {
            status: 'error',
            message: 'Preview job not found',
          };
          return jsonResponse(response, 404);
        }

        // Find assets that are ONLY associated with this preview protocol
        // (not shared with any regular protocols or other preview protocols)
        const assetsToDelete = await prisma.asset.findMany({
          where: {
            AND: [
              { previewProtocols: { some: { id: protocolId } } },
              { previewProtocols: { every: { id: protocolId } } },
              { protocols: { none: {} } },
            ],
          },
          select: { key: true },
        });

        // Delete assets from UploadThing (best effort)
        if (assetsToDelete.length > 0) {
          try {
            const storageLayer = await getStorageLayer();
            await Effect.gen(function* () {
              const assetStorage = yield* AssetStorage;
              yield* assetStorage.deleteAssets(
                assetsToDelete.map((a) => a.key),
              );
            }).pipe(Effect.provide(storageLayer), Effect.runPromise);
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

        // Delete the preview protocol
        await prisma.previewProtocol.delete({
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
    await captureException(error);
    after(async () => {
      await shutdownPostHog();
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
