// middleware.ts
import { verifyRequestOrigin } from 'lucia';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';

export const withCSRFProtection: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    if (request.method === 'GET') {
      return NextResponse.next();
    }
    const originHeader = request.headers.get('Origin');
    // NOTE: You may need to use `X-Forwarded-Host` instead
    const hostHeader = request.headers.get('Host');
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return new NextResponse(null, {
        status: 403,
      });
    }
    return NextResponse.next();
  };
};
