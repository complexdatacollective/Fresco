import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import SuperJSON from 'superjson';
import { v4 as uuid } from 'uuid';
import InterviewShell from '~/lib/interviewer/InterviewShell';
import { prisma } from '~/lib/db';
import { getPreviewMode } from '~/queries/appSettings';
import { getProtocolForPreview } from '~/queries/protocols';

export default function PreviewInterviewPage(props: {
  params: Promise<{ protocolId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center">
          <Loader2 size={64} className="animate-spin" />
        </main>
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

  if (!protocol.isPreview) {
    notFound();
  }

  if (protocol.isPending) {
    notFound();
  }

  await prisma.protocol.update({
    where: { id: protocolId },
    data: { importedAt: new Date() },
  });

  const now = new Date();
  const previewInterview = {
    id: `preview-${uuid()}`,
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
