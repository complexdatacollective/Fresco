import { type NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '~/actions/apiTokens';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';
import { getServerSession } from '~/utils/auth';

// CORS headers for external clients (like Architect)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Helper to create JSON responses with CORS headers
export function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// Check preview mode and authentication
// Returns null if authorized, or an error response if not
export async function checkPreviewAuth(
  req: NextRequest,
): Promise<NextResponse | null> {
  // Check if preview mode is enabled
  if (!env.PREVIEW_MODE) {
    return jsonResponse({ error: 'Preview mode is not enabled' }, 403);
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
        return jsonResponse(
          { error: 'Authentication required. Provide session or API token.' },
          401,
        );
      }

      const { valid } = await verifyApiToken(token);

      if (!valid) {
        return jsonResponse({ error: 'Invalid API token' }, 401);
      }
    }
  }

  return null;
}
