import { NextResponse, type NextRequest } from 'next/server';
import { trackEvent } from '~/analytics/utils';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic'; // defaults to auto

const handler = async (
  req: NextRequest,
  { params }: { params: { protocolId: string } },
) => {
  const protocolId = params.protocolId; // From route segment

  // If no protocol ID is provided, redirect to the error page.
  if (!protocolId || protocolId === 'undefined') {
    void trackEvent({
      type: 'Error',
      error: new Error('No protocol ID provided.'),
      metadata: {
        details: 'No protocol ID provided',
        path: '/onboard/[protocolId]/route.ts',
      },
    });

    return NextResponse.redirect(new URL('/onboard/error', req.nextUrl));
  }

  let participantId: string | undefined;

  // If the request is a POST, check the request body for a participant ID.
  // Otherwise, check the searchParams for a participant ID.
  if (req.method === 'POST') {
    const postData = (await req.json()) as
      | { participantId?: string }
      | undefined;
    participantId = postData?.participantId;
  } else {
    const searchParams = req.nextUrl.searchParams;
    participantId = searchParams.get('participantId') ?? undefined;
  }

  // Create a new interview given the protocolId and participantId
  const { createdInterviewId, error } = await api.interview.create.mutate({
    participantId,
    protocolId,
  });

  if (error) {
    void trackEvent({
      type: 'Error',
      error: new Error(error),
      metadata: {
        details: 'Failed to create interview',
        path: '/onboard/[protocolId]/route.ts',
      },
    });

    return NextResponse.redirect(new URL('/onboard/error', req.nextUrl));
  }

  // eslint-disable-next-line no-console
  console.log(
    `🚀 Created interview with ID ${createdInterviewId} using protocol ${protocolId} for participant ${
      participantId ?? 'Anonymous'
    }...`,
  );

  void trackEvent({
    type: 'InterviewStarted',
    metadata: {
      timestamp: new Date().toISOString(),
      usingAnonymousParticipant: !participantId,
    },
  });

  // Redirect to the interview
  return NextResponse.redirect(
    new URL(`/interview/${createdInterviewId}`, req.nextUrl),
  );
};

export { handler as GET, handler as POST };
