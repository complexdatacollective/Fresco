import { after, type NextRequest, NextResponse } from 'next/server';

import { CodebookSchema } from '@codaco/protocol-validation';
import { ensureError } from '@codaco/shared-consts';
import {
  createCorsHeaders,
  requireApiTokenAuth,
} from '~/app/api/_helpers/auth';
import { prisma } from '~/lib/db';
import { parseStoredInterviewSession } from '~/lib/db/storedInterviewSession';
import { captureException, flushPostHog } from '~/lib/posthog-server';
import { getAppSetting } from '~/queries/appSettings';

const corsHeaders = createCorsHeaders('GET, OPTIONS');

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ version: string; interviewId: string }> },
) {
  const { version, interviewId } = await params;

  if (version !== 'v1') {
    return NextResponse.json(
      { error: `Unsupported API version: ${version}` },
      { status: 404, headers: corsHeaders },
    );
  }

  const enabled = await getAppSetting('enableInterviewDataApi');
  if (!enabled) {
    return NextResponse.json(
      { error: 'Interview Data API is not enabled' },
      { status: 403, headers: corsHeaders },
    );
  }

  const authResult = await requireApiTokenAuth(request);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: 'Authentication required. Provide a Bearer token.' },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        participant: {
          select: {
            id: true,
            identifier: true,
            label: true,
          },
        },
        protocol: {
          select: {
            id: true,
            name: true,
            schemaVersion: true,
            description: true,
            codebook: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    // Answer with the interview as the deployment reads it, or not at all:
    // presenting an empty network or codebook for one that does not parse
    // would misreport what the interview holds.
    const stored = parseStoredInterviewSession(interview);
    const codebook = CodebookSchema.safeParse(interview.protocol.codebook);
    if (!stored.success || !codebook.success) {
      const error = stored.success ? codebook.error : stored.error;
      after(async () => {
        await captureException(error, {
          context: 'api.interview.unreadable',
        });
        await flushPostHog();
      });

      return NextResponse.json(
        { error: 'Stored interview data could not be read' },
        { status: 500, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        data: {
          ...interview,
          ...stored.data,
          protocol: { ...interview.protocol, codebook: codebook.data },
        },
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    const error = ensureError(e);
    await captureException(error);
    after(async () => {
      await flushPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500, headers: corsHeaders },
    );
  }
}
