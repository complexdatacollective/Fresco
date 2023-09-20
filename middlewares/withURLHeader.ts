import { NextResponse, type NextRequest } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';

export const withURLHeader: MiddlewareFactory =
  (next) => async (request: NextRequest, _next) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);

    // Todo: I can't work out how exactly to prevent the middleware stack from
    // being cancelled when I return a vanilla NextResponse.
    await next(request, _next);

    return NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders,
      },
    });
  };
