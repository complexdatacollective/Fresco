import type { NextFetchEvent, NextRequest } from 'next/server';
import type { MiddlewareFactory } from './stackMiddleware';

export const withLogger: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    // eslint-disable-next-line no-console
    console.log('Route: ', request.nextUrl.pathname);
    return next(request, _next);
  };
};
