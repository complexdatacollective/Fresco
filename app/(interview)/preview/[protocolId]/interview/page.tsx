import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { notFound } from 'next/navigation';
import SuperJSON from 'superjson';
import { v4 as uuid } from 'uuid';
import { env } from '~/env';
import { prisma } from '~/utils/db';
import InterviewShell from '../../../interview/_components/InterviewShell';

export const dynamic = 'force-dynamic';

/**
 * Fetches the protocol with assets for preview mode.
 * Similar to prisma_getInterviewById but without the interview.
 */
async function getProtocolForPreview(protocolId: string) {
  return prisma.protocol.findUnique({
    where: { id: protocolId },
    include: { assets: true },
    omit: {
      lastModified: true,
      hash: true,
    },
  });
}

export default async function PreviewInterviewPage({
  params,
}: {
  params: { protocolId: string };
}) {
  const { protocolId } = params;

  if (!env.PREVIEW_MODE) {
    notFound();
  }

  if (!protocolId) {
    notFound();
  }

  const protocol = await getProtocolForPreview(protocolId);

  if (!protocol) {
    notFound();
  }

  // Only allow preview protocols
  if (!protocol.isPreview) {
    notFound();
  }

  // Don't allow pending protocols (still uploading assets)
  if (protocol.isPending) {
    notFound();
  }

  // Update timestamp to prevent premature pruning
  await prisma.protocol.update({
    where: { id: protocolId },
    data: { importedAt: new Date() },
  });

  // Create an in-memory interview object (not persisted to database)
  const now = new Date();
  const previewInterview = {
    id: `preview-${uuid()}`, // Temporary ID for the preview session
    startTime: now,
    finishTime: null,
    exportTime: null,
    lastUpdated: now,
    currentStep: 0,
    stageMetadata: null,
    network: {
      ego: {
        [entityPrimaryKeyProperty]: uuid(),
        [entityAttributesProperty]: {},
      },
      nodes: [],
      edges: [],
    },
    protocol,
  };

  const rawPayload = SuperJSON.stringify(previewInterview);

  return <InterviewShell rawPayload={rawPayload} disableSync />;
}
