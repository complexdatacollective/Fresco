import { type NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '~/actions/apiTokens';

export function createCorsHeaders(methods: string) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function requireApiTokenAuth(
  req: NextRequest,
): Promise<{ valid: true } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required. Provide a Bearer token.' },
        { status: 401 },
      ),
    };
  }

  const { valid } = await verifyApiToken(token);

  if (!valid) {
    return {
      error: NextResponse.json({ error: 'Invalid API token' }, { status: 401 }),
    };
  }

  return { valid: true };
}
