import {
  migrateProtocol,
  validateProtocol,
} from '@codaco/protocol-validation';
import JSZip from 'jszip';
import { hash } from 'ohash';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { getAppSetting } from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { getProtocolAssets, getProtocolJson } from '~/utils/protocolImport';
import { verifyApiToken } from '~/actions/apiTokens';
import { addEvent } from '~/actions/activityFeed';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';

export async function POST(req: NextRequest) {
  // Check if preview mode is enabled
  if (!env.PREVIEW_MODE) {
    return NextResponse.json(
      { error: 'Preview mode is not enabled' },
      { status: 403 },
    );
  }

  // Check authentication if required
  const requireAuth = await getAppSetting('previewModeRequireAuth');

  if (requireAuth) {
    // Try session-based auth first
    const session = await getServerSession();

    if (!session) {
      // Try API token auth
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required. Provide session or API token.' },
          { status: 401 },
        );
      }

      const { valid } = await verifyApiToken(token);

      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid API token' },
          { status: 401 },
        );
      }
    }
  }

  try {
    // Get the uploaded file
    const formData = await req.formData();
    const file = formData.get('protocol') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No protocol file provided' },
        { status: 400 },
      );
    }

    // Verify it's a .netcanvas file
    if (!file.name.endsWith('.netcanvas')) {
      return NextResponse.json(
        { error: 'File must be a .netcanvas file' },
        { status: 400 },
      );
    }

    const protocolName = file.name.replace('.netcanvas', '');

    // Parse the zip file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract protocol.json
    const protocolJson = await getProtocolJson(zip);

    // Check schema version
    const protocolVersion = protocolJson.schemaVersion;
    if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
      return NextResponse.json(
        {
          error: `Unsupported protocol schema version: ${protocolVersion}. Supported versions: ${APP_SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Migrate if needed
    const protocolToValidate =
      protocolJson.schemaVersion < 8
        ? migrateProtocol(protocolJson, 8)
        : protocolJson;

    // Validate protocol
    const validationResult = await validateProtocol(protocolToValidate);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(
        ({ message, path }) => `${message} (${path.join(' > ')})`,
      );

      return NextResponse.json(
        {
          error: 'Protocol validation failed',
          validationErrors: errors,
        },
        { status: 400 },
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
        protocolJson,
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
        `Preview protocol "${protocolName}" uploaded`,
      );
    }

    // Return the protocol ID and redirect URL
    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
    url.pathname = `/preview/${protocolId}`;

    return NextResponse.json(
      {
        success: true,
        protocolId,
        redirectUrl: url.toString(),
      },
      { status: 200 },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Preview protocol upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process protocol',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
