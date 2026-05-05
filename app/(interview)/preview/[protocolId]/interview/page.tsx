import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { v4 as uuid } from 'uuid';
import Spinner from '@codaco/fresco-ui/Spinner';
import { prisma } from '~/lib/db';
import {
  isValidAssetType,
  type InterviewPayload,
  type ResolvedAsset,
} from '@codaco/interview';
import { getPreviewMode } from '~/queries/appSettings';
import { getProtocolForPreview } from '~/queries/protocols';
import PreviewInterviewClient from './PreviewInterviewClient';

export default function PreviewInterviewPage(props: {
  params: Promise<{ protocolId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PreviewContent params={props.params} />
    </Suspense>
  );
}

async function PreviewContent({
  params: paramsPromise,
}: {
  params: Promise<{ protocolId: string }>;
}) {
  await connection();
  const { protocolId } = await paramsPromise;

  const previewMode = await getPreviewMode();
  if (!previewMode) {
    notFound();
  }

  if (!protocolId) {
    notFound();
  }

  const protocol = await getProtocolForPreview(protocolId);

  if (!protocol) {
    notFound();
  }

  // Don't allow pending protocols (still uploading assets)
  if (protocol.isPending) {
    notFound();
  }

  // Bump importedAt on preview protocols so the periodic pruner doesn't
  // remove them mid-interview. Regular protocols are not pruned, so skip.
  if (protocol.isPreview) {
    await prisma.protocol.update({
      where: { id: protocolId },
      data: { importedAt: new Date() },
    });
  }

  const now = new Date();

  const previewAssetUrls: Record<string, string> = {};
  for (const a of protocol.assets) {
    if (a.url) previewAssetUrls[a.assetId] = a.url;
  }

  const assets: ResolvedAsset[] = protocol.assets.map((a) => {
    if (!isValidAssetType(a.type)) {
      throw new Error(`Unknown asset type: ${String(a.type)}`);
    }
    return {
      assetId: a.assetId,
      name: a.name,
      type: a.type,
      value: a.value ?? undefined,
    };
  });

  const payload: InterviewPayload = {
    session: {
      id: `preview-${uuid()}`,
      startTime: now.toISOString(),
      finishTime: null,
      exportTime: null,
      lastUpdated: now.toISOString(),
      stageMetadata: undefined,
      network: {
        ego: {
          [entityPrimaryKeyProperty]: uuid(),
          [entityAttributesProperty]: {},
        },
        nodes: [],
        edges: [],
      },
    },
    protocol: {
      ...protocol,
      schemaVersion: 8,
      hash: protocol.hash,
      description: protocol.description ?? undefined,
      importedAt: protocol.importedAt.toISOString(),
      assets,
    },
  };

  return (
    <PreviewInterviewClient
      payload={payload}
      assetUrls={previewAssetUrls}
      initialStep={0}
    />
  );
}
