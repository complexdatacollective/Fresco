import { type NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to add CORS headers to the /preview route.
 * This allows external clients (like Architect) to upload protocols via API.
 */
export function middleware(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Continue to the route handler
  const response = NextResponse.next();

  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Only apply this middleware to the /preview route
export const config = {
  matcher: '/preview',
};
