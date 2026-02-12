import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createInterview } from '~/actions/interviews';
import { env } from '~/env';
import trackEvent from '~/lib/analytics';
import { getAppSetting } from '~/queries/appSettings';

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ protocolId: string }> },
) => {
  console.log('Received request to start interview with params:');
  try {
    const { protocolId } = await params;

    // when deployed via docker `req.url` and `req.nextUrl`
    // shows Docker Container ID instead of real host
    // issue: https://github.com/vercel/next.js/issues/65568
    // workaround: use `env.PUBLIC_URL` to get the correct url
    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());

    // If no protocol ID is provided, redirect to the error page.
    if (!protocolId || protocolId === 'undefined') {
      throw new Error('No protocol ID provided');
    }

    const limitInterviews = await getAppSetting('limitInterviews');

    // if limitInterviews is enabled
    // Check cookies for interview already completed for this user for this protocol
    // and redirect to finished page
    if (limitInterviews && (await cookies()).get(protocolId)) {
      url.pathname = '/interview/finished';
      return NextResponse.redirect(url);
    }

    let participantIdentifier: string | undefined;

    // If the request is a POST, check the request body for a participant identifier.
    // Otherwise, check the searchParams for a participant identifier.
    if (req.method === 'POST') {
      const postData = (await req.json()) as
        | { participantIdentifier?: string }
        | undefined;
      participantIdentifier = postData?.participantIdentifier;
    } else {
      const searchParams = req.nextUrl.searchParams;
      participantIdentifier =
        searchParams.get('participantIdentifier') ?? undefined;
    }

    // Create a new interview given the protocolId and participantId
    const { createdInterviewId, error, errorType } = await createInterview({
      participantIdentifier,
      protocolId,
    });

    if (error) {
      throw new Error(`Error creating interview: ${errorType} - ${error}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      `🚀 Created interview with ID ${createdInterviewId} using protocol ${protocolId} for participant ${
        participantIdentifier ?? 'Anonymous'
      }...`,
    );

    void trackEvent({
      type: 'InterviewStarted',
      metadata: {
        usingAnonymousParticipant: !participantIdentifier,
      },
    });

    // Redirect to the interview
    url.pathname = `/interview/${createdInterviewId}`;
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error in interview creation route:', error);

    const url = new URL(env.PUBLIC_URL ?? req.nextUrl.clone());
    url.pathname = '/onboard/error';

    await trackEvent({
      type: 'Error',
      name: 'UnexpectedError',
      message: 'An unexpected error occurred during interview creation',
      metadata: {
        path: '/onboard/[protocolId]/route.ts',
        error: String(error),
      },
    });

    return NextResponse.redirect(url);
  }
};

export { handler as GET, handler as POST };
