import { NextResponse, type NextRequest } from 'next/server';
import { createInterview } from '~/actions/interviews';
import { env } from '~/env';
import trackEvent from '~/lib/analytics';
import { prisma } from '~/utils/db';

export const dynamic = 'force-dynamic';

const handler = async (
  req: NextRequest,
  { params }: { params: { protocolId: string } },
) => {
  const protocolId = params.protocolId;

  // Check if preview mode is enabled
  if (!env.PREVIEW_MODE) {
    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());

  // Validate protocol ID
  if (!protocolId || protocolId === 'undefined') {
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  // Verify that this is actually a preview protocol
  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    select: { isPreview: true, isPending: true, name: true },
  });

  if (!protocol) {
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  if (!protocol.isPreview) {
    // Not a preview protocol, redirect to regular onboard
    url.pathname = `/onboard/${protocolId}`;
    return NextResponse.redirect(url);
  }

  if (protocol.isPending) {
    // Protocol assets are still being uploaded
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  // Update timestamp to prevent premature pruning
  await prisma.protocol.update({
    where: { id: protocolId },
    data: { importedAt: new Date() },
  });

  // Create a new interview for preview
  // We use a fixed participant identifier for preview sessions
  const participantIdentifier = `preview-${Date.now()}`;

  const { createdInterviewId, error } = await createInterview({
    participantIdentifier,
    protocolId,
  });

  if (error) {
    void trackEvent({
      type: 'Error',
      name: error,
      message: 'Failed to create preview interview',
      metadata: {
        path: '/preview/[protocolId]/route.ts',
      },
    });

    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  // eslint-disable-next-line no-console
  console.log(
    `🎨 Created preview interview with ID ${createdInterviewId} using preview protocol ${protocol.name}...`,
  );

  void trackEvent({
    type: 'InterviewStarted',
    metadata: {
      protocolId,
      isPreview: true,
    },
  });

  // Redirect to the interview
  url.pathname = `/interview/${createdInterviewId}`;
  return NextResponse.redirect(url);
};

export { handler as GET, handler as POST };
