import { type NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '~/actions/apiTokens';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';
import type { AuthError, PreviewResponse } from './types';

// CORS headers for external client (Architect)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to create JSON responses with CORS headers
export function jsonResponse(data: PreviewResponse, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// Check preview mode and authentication
// Returns null if authorized, or error data if not
export async function checkPreviewAuth(
  req: NextRequest,
): Promise<AuthError | null> {
  // Check if preview mode is enabled
  if (!env.PREVIEW_MODE) {
    return {
      response: {
        status: 'error',
        message: 'Preview mode is not enabled',
      },
      status: 403,
    };
  }

  // Check authentication if required
  const requireAuth = await getAppSetting('previewModeRequireAuth');

  if (requireAuth) {
    // Try session-based auth first
    const session = await getServerSession();

    if (!session) {
      // Try API token auth
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return {
          response: {
            status: 'error',
            message: 'Authentication required. Provide session or API token.',
          },
          status: 401,
        };
      }

      const { valid } = await verifyApiToken(token);

      if (!valid) {
        return {
          response: {
            status: 'error',
            message: 'Invalid API token',
          },
          status: 401,
        };
      }
    }
  }

  return null;
}
