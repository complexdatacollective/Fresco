import { after, type NextRequest, NextResponse } from 'next/server';
import {
  createCorsHeaders,
  requireApiTokenAuth,
} from '~/app/api/_helpers/auth';
import { prisma } from '~/lib/db';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { getAppSetting } from '~/queries/appSettings';
import { ensureError } from '~/utils/ensureError';

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

    return NextResponse.json({ data: interview }, { headers: corsHeaders });
  } catch (e) {
    const error = ensureError(e);
    await captureException(error);
    after(async () => {
      await shutdownPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500, headers: corsHeaders },
    );
  }
}
