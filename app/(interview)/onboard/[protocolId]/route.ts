import { faker } from '@faker-js/faker';
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
      error: {
        details: 'No protocol ID provided',
        message: 'No protocol ID provided',
        path: '/onboard/[protocolId]/route.ts',
        stacktrace: '',
      },
    });

    return NextResponse.redirect(new URL('/onboard/error', req.nextUrl));
  }

  let participantId: string | undefined;
  let participantIdentifier: string | undefined;

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

  // If no participant ID is provided in searchParams or request body, check
  // if anonymous recruitment is enabled. If it is, generate a new participant
  // identifier.
  if (!participantId || participantId === 'undefined') {
    const appSettings = await api.appSettings.get.query();

    if (!appSettings || !appSettings.allowAnonymousRecruitment) {
      return NextResponse.redirect(
        new URL('/interview/no-anonymous-recruitment', req.nextUrl),
      );
    }

    // Generate a participantID - this will be used as a **identifier** rather
    // than an ID.
    participantIdentifier = faker.string.uuid();

    // eslint-disable-next-line no-console
    console.log(
      `🕵️🚫 No participantID provided, but anonymous recruitment enabled. Generated an identifier: ${participantIdentifier}.`,
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(`🕵️✅ Using provided participantID: ${participantId}.`);
  }

  // Create a new interview given the protocolId and participantId
  const { createdInterviewId, error } = await api.interview.create.mutate({
    participantId,
    participantIdentifier,
    protocolId,
  });

  if (error) {
    void trackEvent({
      type: 'Error',
      error: {
        details: error,
        message: 'Failed to create interview',
        path: '/onboard/[protocolId]/route.ts',
        stacktrace: '',
      },
    });

    return NextResponse.redirect(new URL('/onboard/error', req.nextUrl));
  }

  // eslint-disable-next-line no-console
  console.log(
    `🚀 Starting interview with ID ${createdInterviewId} and protocol ${protocolId}...`,
  );

  // Redirect to the interview
  return NextResponse.redirect(
    new URL(`/interview/${createdInterviewId}`, req.nextUrl),
  );
};

export { handler as GET, handler as POST };
