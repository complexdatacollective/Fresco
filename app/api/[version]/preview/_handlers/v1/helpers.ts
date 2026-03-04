import { type NextRequest, NextResponse } from 'next/server';
import { requireApiTokenAuth } from '~/app/api/_helpers/auth';
import { getAppSetting, getPreviewMode } from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';
import type { AuthError, PreviewResponse } from './types';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function jsonResponse(data: PreviewResponse, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function checkPreviewAuth(
  req: NextRequest,
): Promise<AuthError | null> {
  const previewMode = await getPreviewMode();
  if (!previewMode) {
    return {
      response: {
        status: 'error',
        message: 'Preview mode is not enabled',
      },
      status: 403,
    };
  }

  const requireAuth = await getAppSetting('previewModeRequireAuth');

  if (requireAuth) {
    const session = await getServerSession();

    if (!session) {
      const result = await requireApiTokenAuth(req);

      if ('error' in result) {
        return {
          response: {
            status: 'error',
            message: 'Authentication required. Provide session or API token.',
          },
          status: 401,
        };
      }
    }
  }

  return null;
}
