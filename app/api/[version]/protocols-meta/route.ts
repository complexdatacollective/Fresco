import { after, type NextRequest, NextResponse } from 'next/server';
import {
  createCorsHeaders,
  requireApiTokenAuth,
} from '~/app/api/_helpers/auth';
import { createVersionedHandler } from '~/app/api/_helpers/versioning';
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

async function v1(request: NextRequest) {
  try {
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
        {
          status: 401,
          headers: { ...corsHeaders, 'WWW-Authenticate': 'Bearer' },
        },
      );
    }

    const protocols = await prisma.protocol.findMany({
      select: {
        id: true,
        name: true,
        importedAt: true,
        lastModified: true,
      },
      orderBy: { importedAt: 'desc' },
    });

    return NextResponse.json(protocols, { headers: corsHeaders });
  } catch (e) {
    const error = ensureError(e);
    captureException(error).catch(() => {
      // swallow telemetry errors so they cannot replace the 500
    });
    after(async () => {
      await shutdownPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500, headers: corsHeaders },
    );
  }
}

const handlers = {
  v1: { GET: v1 },
};

export const GET = createVersionedHandler(handlers, 'GET');
