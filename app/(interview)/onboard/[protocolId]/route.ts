import { faker } from '@faker-js/faker';
import { NextResponse, type NextRequest } from 'next/server';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic'; // defaults to auto

const handler = async (
  req: NextRequest,
  { params }: { params: { protocolId: string } },
) => {
  const protocolId = params.protocolId; // From route segment
  let postData = undefined;

  // We need to check the request method to see if we should parse the body - it
  // fails on GET requests.
  if (req.method === 'POST') {
    postData = (await req.json()) as { participantId?: string } | undefined;
  }

  const searchParams = req.nextUrl.searchParams;

  let participantId =
    searchParams.get('participantId') ?? postData?.participantId;

  // If no participant ID is provided in searchParams or request body, check
  // if anonymous recruitment is enabled to see if we should generate one.
  if (!participantId) {
    const appSettings = await api.appSettings.get.query();

    if (!appSettings || !appSettings.allowAnonymousRecruitment) {
      return NextResponse.redirect(
        new URL('/interview/no-anonymous-recruitment', req.nextUrl),
      );
    }

    // Generate a participantID - this will be used as a **identifier** rather
    // than an ID.
    participantId = faker.string.uuid();

    // eslint-disable-next-line no-console
    console.log(
      `🕵️🚫 No participantID provided. Generated a new identifier: ${participantId}.`,
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(`🕵️✅ Using provided participantID: ${participantId}.`);
  }

  // Create a new interview given the protocolId and participantId
  const { createdInterviewId, error } = await api.interview.create.mutate({
    participantId,
    protocolId,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create interview', errorType: error },
      { status: 500 },
    );
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
