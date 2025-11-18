import { validateProtocol } from '@codaco/protocol-validation';
import JSZip from 'jszip';
import { hash } from 'ohash';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { deduplicateAssets } from '~/lib/asset-hashing';
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

    // Parse the zip file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract protocol.json
    const protocolJson = await getProtocolJson(zip);

    // Validate protocol
    const validationResult = await validateProtocol(protocolJson);

    if (!validationResult.isValid) {
      const errors = [
        ...validationResult.schemaErrors,
        ...validationResult.logicErrors,
      ].map((e) => `${e.message} (${e.path})`);

      return NextResponse.json(
        {
          error: 'Protocol validation failed',
          validationErrors: errors,
        },
        { status: 400 },
      );
    }

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
      // Increment upload count
      const updated = await prisma.protocol.update({
        where: { id: existingPreview.id },
        data: {
          uploadCount: {
            increment: 1,
          },
          importedAt: new Date(), // Update timestamp to prevent premature pruning
        },
      });
      protocolId = updated.id;
    } else {
      // Extract and deduplicate assets
      const assets = await getProtocolAssets(protocolJson, zip);

      const { assetsToUpload, assetIdToExistingAssetMap } =
        await deduplicateAssets(assets);

      // Upload new assets to UploadThing (if any)
      let newAssetRecords: {
        key: string;
        assetId: string;
        name: string;
        type: string;
        url: string;
        size: number;
      }[] = [];

      if (assetsToUpload.length > 0) {
        const files = assetsToUpload.map((asset) => asset.file);

        // Note: uploadFiles is a client helper, we need to use server-side upload
        // For server-side, we'll use the UTApi directly
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

        newAssetRecords = assetsToUpload.map((asset, idx) => {
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

      // Get existing asset IDs to connect
      const existingAssetIds = Array.from(assetIdToExistingAssetMap.keys());

      // Create the protocol in the database
      const protocol = await prisma.protocol.create({
        data: {
          hash: protocolHash,
          name: protocolJson.name,
          schemaVersion: protocolJson.schemaVersion,
          description: protocolJson.description,
          lastModified: new Date(protocolJson.lastModified),
          stages: protocolJson.stages as never,
          codebook: protocolJson.codebook as never,
          isPreview: true,
          uploadCount: 1,
          assets: {
            create: newAssetRecords,
            connect: existingAssetIds.map((assetId) => ({ assetId })),
          },
        },
      });

      protocolId = protocol.id;

      void addEvent(
        'Preview Protocol Uploaded',
        `Preview protocol "${protocolJson.name}" uploaded`,
      );
    }

    // Redirect to preview interview route
    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
    url.pathname = `/preview/${protocolId}`;

    return NextResponse.redirect(url);
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
