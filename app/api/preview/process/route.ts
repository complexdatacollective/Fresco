import {
  type CurrentProtocol,
  migrateProtocol,
  validateProtocol,
} from '@codaco/protocol-validation';
import JSZip from 'jszip';
import { type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { env } from '~/env';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { getFileUrlByKey } from '~/lib/uploadthing-presigned';
import { prisma } from '~/utils/db';
import { getProtocolAssets, getProtocolJson } from '~/utils/protocolImport';
import { checkPreviewAuth, jsonResponse, OPTIONS } from '../helpers';

export { OPTIONS };

export async function POST(req: NextRequest) {
  const authError = await checkPreviewAuth(req);
  if (authError) return authError;

  try {
    // Get file info from request body
    const body = (await req.json()) as {
      fileKey?: string;
      fileName?: string;
    };

    const { fileKey, fileName } = body;

    if (!fileKey || typeof fileKey !== 'string') {
      return jsonResponse({ error: 'fileKey is required' }, 400);
    }

    // Get the file URL from the key
    const fileUrl = await getFileUrlByKey(fileKey);

    if (!fileUrl) {
      return jsonResponse(
        {
          error:
            'Failed to get file URL. UploadThing token may not be configured.',
        },
        500,
      );
    }

    // Download the file from UploadThing
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return jsonResponse(
        {
          error: `Failed to download file from UploadThing: ${fileResponse.status} ${fileResponse.statusText}`,
        },
        500,
      );
    }

    const arrayBuffer = await fileResponse.arrayBuffer();

    // Derive protocol name from fileName or fileKey
    const protocolName = fileName
      ? fileName.replace('.netcanvas', '')
      : `protocol-${fileKey.slice(0, 8)}`;

    // Parse the zip file
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract protocol.json
    const protocolJson = await getProtocolJson(zip);

    // Check schema version
    const protocolVersion = protocolJson.schemaVersion;
    if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
      return jsonResponse(
        {
          error: `Unsupported protocol schema version: ${protocolVersion}. Supported versions: ${APP_SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
        },
        400,
      );
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
      const errors = validationResult.error.issues.map(
        ({ message, path }) => `${message} (${path.join(' > ')})`,
      );

      return jsonResponse(
        {
          error: 'Protocol validation failed',
          validationErrors: errors,
        },
        400,
      );
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

    let protocolId: string;

    if (existingPreview) {
      // Update timestamp to prevent premature pruning
      const updated = await prisma.protocol.update({
        where: { id: existingPreview.id },
        data: {
          importedAt: new Date(),
        },
      });
      protocolId = updated.id;
    } else {
      // Extract assets
      const { fileAssets, apikeyAssets } = await getProtocolAssets(
        protocolToValidate,
        zip,
      );

      // Combine all assets for checking
      const allAssets = [...fileAssets, ...apikeyAssets];

      // Check which assets already exist in the database
      const assetIds = allAssets.map((a) => a.assetId);
      const existingDbAssets = await prisma.asset.findMany({
        where: {
          assetId: {
            in: assetIds,
          },
        },
        select: {
          assetId: true,
        },
      });

      const existingAssetIds = existingDbAssets.map((a) => a.assetId);

      // Only upload file assets that don't exist (apikey assets don't need uploading)
      const fileAssetsToUpload = fileAssets.filter(
        (a) => !existingAssetIds.includes(a.assetId),
      );

      // Apikey assets to create (if they don't already exist)
      const apikeyAssetsToCreate = apikeyAssets.filter(
        (a) => !existingAssetIds.includes(a.assetId),
      );

      // Upload new file assets to UploadThing (if any)
      let newAssetRecords: {
        key: string;
        assetId: string;
        name: string;
        type: string;
        url: string;
        size: number;
        value?: string;
      }[] = [];

      if (fileAssetsToUpload.length > 0) {
        const files = fileAssetsToUpload.map((asset) => asset.file);

        // Use UTApi for server-side upload
        const { getUTApi } = await import('~/lib/uploadthing-server-helpers');
        const utapi = await getUTApi();

        const uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const uploaded = await utapi.uploadFiles(file);
            if (uploaded.error) {
              throw new Error(`Failed to upload asset: ${file.name}`);
            }
            return uploaded.data;
          }),
        );

        newAssetRecords = fileAssetsToUpload.map((asset, idx) => {
          const uploaded = uploadedFiles[idx]!;
          return {
            key: uploaded.key,
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            url: uploaded.url,
            size: uploaded.size,
          };
        });
      }

      // Add apikey assets (they don't need uploading, just database records)
      newAssetRecords.push(...apikeyAssetsToCreate);

      // Create the protocol in the database
      const protocol = await prisma.protocol.create({
        data: {
          hash: protocolHash,
          name: protocolName,
          schemaVersion: protocolJson.schemaVersion,
          description: protocolJson.description,
          lastModified: protocolJson.lastModified
            ? new Date(protocolJson.lastModified)
            : new Date(),
          stages: protocolJson.stages as never,
          codebook: protocolJson.codebook as never,
          isPreview: true,
          assets: {
            create: newAssetRecords,
            connect: existingAssetIds.map((assetId) => ({ assetId })),
          },
        },
      });

      protocolId = protocol.id;

      void addEvent(
        'Preview Protocol Uploaded',
        `Preview protocol "${protocolName}" uploaded via presigned URL`,
      );
    }

    // Return the protocol ID and redirect URL
    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
    url.pathname = `/preview/${protocolId}`;

    return jsonResponse({
      success: true,
      protocolId,
      redirectUrl: url.toString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Preview protocol process error:', error);

    return jsonResponse(
      {
        error: 'Failed to process protocol',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
}
