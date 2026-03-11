import { after, NextResponse, type NextRequest } from 'next/server';
import { env } from '~/env';
import { captureEvent, shutdownPostHog } from '~/lib/posthog-server';
import { prisma } from '~/lib/db';
import { getPreviewMode } from '~/queries/appSettings';

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ protocolId: string }> },
) => {
  const { protocolId } = await params;

  // Check if preview mode is enabled
  const previewMode = await getPreviewMode();
  if (!previewMode) {
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

  // Verify that this is a preview protocol
  const protocol = await prisma.previewProtocol.findUnique({
    where: { id: protocolId },
    select: { isPending: true, name: true },
  });

  if (!protocol) {
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  if (protocol.isPending) {
    // Protocol assets are still being uploaded
    url.pathname = '/onboard/error';
    return NextResponse.redirect(url);
  }

  // eslint-disable-next-line no-console
  console.log(
    `🎨 Starting preview interview using preview protocol ${protocol.name}...`,
  );

  after(async () => {
    await captureEvent('InterviewStarted', {
      protocolId,
      isPreview: true,
    });
    await shutdownPostHog();
  });

  // Redirect to the preview interview page (clear any stale query params)
  url.pathname = `/preview/${protocolId}/interview`;
  url.search = '';
  return NextResponse.redirect(url);
};

export { handler as GET, handler as POST };
