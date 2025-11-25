import {
  type CurrentProtocol,
  migrateProtocol,
  type VersionedProtocol,
  validateProtocol,
} from '@codaco/protocol-validation';
import { type NextRequest } from 'next/server';
import { hash } from 'ohash';
import { addEvent } from '~/actions/activityFeed';
import { env } from '~/env';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import { prunePreviewProtocols } from '~/lib/preview-protocol-pruning';
import { prisma } from '~/utils/db';
import { checkPreviewAuth, jsonResponse, OPTIONS } from '../helpers';

export { OPTIONS };

type AssetInput = {
  assetId: string;
  key: string;
  name: string;
  type: string;
  url: string;
  size: number;
  value?: string; // For apikey assets
};

type ProcessRequestBody = {
  protocol: VersionedProtocol;
  protocolName?: string;
  assets: AssetInput[];
};

export async function POST(req: NextRequest) {
  const authError = await checkPreviewAuth(req);
  if (authError) return authError;

  try {
    const body = (await req.json()) as ProcessRequestBody;

    const { protocol: protocolJson, protocolName, assets } = body;

    if (!protocolJson || typeof protocolJson !== 'object') {
      return jsonResponse({ error: 'protocol object is required' }, 400);
    }

    if (!assets || !Array.isArray(assets)) {
      return jsonResponse({ error: 'assets array is required' }, 400);
    }

    // Validate asset structure
    for (const asset of assets) {
      if (!asset.assetId || !asset.key || !asset.name || !asset.type) {
        return jsonResponse(
          {
            error: 'Each asset must have assetId, key, name, and type',
          },
          400,
        );
      }
    }

    // Derive protocol name
    const name = protocolName ?? `preview-${Date.now()}`;

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
        },
      });

      const existingAssetIds = new Set(existingDbAssets.map((a) => a.assetId));

      // Assets to create (ones that don't already exist)
      const assetsToCreate = assets
        .filter((a) => !existingAssetIds.has(a.assetId))
        .map((a) => ({
          assetId: a.assetId,
          key: a.key,
          name: a.name,
          type: a.type,
          url: a.url,
          size: a.size,
          value: a.value,
        }));

      // Create the protocol in the database
      const protocol = await prisma.protocol.create({
        data: {
          hash: protocolHash,
          name,
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
            connect: Array.from(existingAssetIds).map((assetId) => ({
              assetId,
            })),
          },
        },
      });

      protocolId = protocol.id;

      void addEvent(
        'Preview Protocol Uploaded',
        `Preview protocol "${name}" uploaded via direct upload`,
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
