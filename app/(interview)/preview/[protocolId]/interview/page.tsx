import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { notFound } from 'next/navigation';
import SuperJSON from 'superjson';
import { v4 as uuid } from 'uuid';
import InterviewShell from '~/app/(interview)/interview/_components/InterviewShell';
import { prisma } from '~/lib/db';
import { getPreviewMode } from '~/queries/appSettings';
import { getProtocolForPreview } from '~/queries/protocols';

export const dynamic = 'force-dynamic';

export default async function PreviewInterviewPage(
  props: {
    params: Promise<{ protocolId: string }>;
  }
) {
  const params = await props.params;
  const { protocolId } = params;

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
