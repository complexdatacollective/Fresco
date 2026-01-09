import { NextResponse, type NextRequest } from 'next/server';
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

  // eslint-disable-next-line no-console
  console.log(
    `🎨 Starting preview interview using preview protocol ${protocol.name}...`,
  );

  void trackEvent({
    type: 'InterviewStarted',
    metadata: {
      protocolId,
      isPreview: true,
    },
  });

  // Redirect to the preview interview page (no database persistence)
  url.pathname = `/preview/${protocolId}/interview`;
  return NextResponse.redirect(url);
};

export { handler as GET, handler as POST };
