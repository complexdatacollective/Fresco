import { after, type NextRequest, NextResponse } from 'next/server';
import {
  createCorsHeaders,
  requireApiTokenAuth,
} from '~/app/api/_helpers/auth';
import { createVersionedHandler } from '~/app/api/_helpers/versioning';
import { prisma } from '~/lib/db';
import { type Prisma } from '~/lib/db/generated/client';
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

async function v1(request: NextRequest) {
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
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get('perPage') ?? '10')),
    );
    const protocolId = searchParams.get('protocolId');
    const participantId = searchParams.get('participantId');
    const status = searchParams.get('status');

    const where: Prisma.InterviewWhereInput = {};

    if (protocolId) {
      where.protocolId = protocolId;
    }

    if (participantId) {
      where.participantId = participantId;
    }

    if (status === 'completed') {
      where.finishTime = { not: null };
    } else if (status === 'in-progress') {
      where.finishTime = null;
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          finishTime: true,
          lastUpdated: true,
          currentStep: true,
          protocolId: true,
          participantId: true,
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
            },
          },
        },
        orderBy: { lastUpdated: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.interview.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: interviews,
        meta: {
          page,
          perPage,
          pageCount: Math.ceil(total / perPage),
          total,
        },
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    const error = ensureError(e);
    await captureException(error);
    after(async () => {
      await shutdownPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500, headers: corsHeaders },
    );
  }
}

const handlers = {
  v1: { GET: v1 },
};

export const GET = createVersionedHandler(handlers, 'GET');
