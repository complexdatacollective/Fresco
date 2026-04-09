import { after, type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { prunePreviewProtocols } from '~/actions/preview-protocol-pruning';
import { env } from '~/env';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { validateAndMigrateProtocol } from '~/lib/protocol/validateAndMigrateProtocol';
import { Effect } from 'effect';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import { getExistingAssets } from '~/queries/protocols';
import { getStorageProvider } from '~/queries/storageProvider';
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

        // Resolve storage provider once; the upload path differs significantly
        // between S3 (true presigned PUT) and UploadThing (server-side proxy
        // via UTApi, because UploadThing's ingest protocol is not a plain
        // presigned PUT).
        const provider =
          newAssets.length > 0 ? await getStorageProvider() : null;

        // For S3 only: pre-compute presigned URLs and asset records. For
        // UploadThing the records are created by the upload proxy route
        // once the real UT-assigned key is known.
        type S3PresignedEntry = {
          uploadUrl: string;
          fileKey: string;
          publicUrl: string;
        };
        let s3Presigned: S3PresignedEntry[] = [];

        if (provider === 's3') {
          const storageLayer = await getStorageLayer();
          const presignedResults = await Effect.gen(function* () {
            const assetStorage = yield* AssetStorage;
            return yield* assetStorage.generatePresignedUploadUrls(
              newAssets.map((a) => ({ name: a.name, size: a.size })),
            );
          }).pipe(Effect.provide(storageLayer), Effect.runPromise);

          s3Presigned = newAssets.map((_asset, i) => {
            const presigned = presignedResults[i]!;
            return {
              uploadUrl: presigned.uploadUrl,
              fileKey: presigned.fileKey,
              publicUrl: presigned.publicUrl,
            };
          });
        }

        const assetsToCreate = s3Presigned.map((presigned, i) => {
          const asset = newAssets[i]!;
          const manifestEntry = assetManifest[asset.assetId];
          return {
            assetId: asset.assetId,
            key: presigned.fileKey,
            name: asset.name,
            type: manifestEntry?.type ?? 'file',
            url: presigned.publicUrl,
            size: asset.size,
          };
        });

        // Create the preview protocol. Mark as pending if there are assets
        // to upload. For UploadThing, asset records are created later by
        // the upload proxy; only existing + apikey assets are attached now.
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

        // If no new assets to upload, return ready immediately
        if (newAssets.length === 0) {
          const url = new URL(env.PUBLIC_URL ?? request.nextUrl.clone());
          url.pathname = `/preview/${protocol.id}`;

          const response: InitializeResponse = {
            status: 'ready',
            previewUrl: url.toString(),
          };
          return jsonResponse(response);
        }

        // Build upload URLs for the response. S3 returns real presigned
        // URLs; UploadThing returns proxy URLs that route back to our
        // own server, which uploads via UTApi on behalf of the client.
        let presignedUrls: { assetId: string; url: string }[] = [];

        if (provider === 's3') {
          presignedUrls = newAssets.map((asset, i) => ({
            assetId: asset.assetId,
            url: s3Presigned[i]!.uploadUrl,
          }));
        } else if (provider === 'uploadthing') {
          const publicBase = env.PUBLIC_URL ?? request.nextUrl.origin;
          const baseOrigin = new URL(publicBase).origin;
          presignedUrls = newAssets.map((asset) => {
            const manifestEntry = assetManifest[asset.assetId];
            const assetType = manifestEntry?.type ?? 'file';
            const params = new URLSearchParams({
              assetId: asset.assetId,
              name: asset.name,
              assetType,
              size: String(asset.size),
            });
            return {
              assetId: asset.assetId,
              url: `${baseOrigin}/api/preview/${protocol.id}/upload?${params.toString()}`,
            };
          });
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
