import type { NextFetchEvent, NextRequest } from 'next/server';
import type { MiddlewareFactory } from './stackMiddleware';

export const withErrorHandler: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    try {
      await next(request, _next);
    } catch (error) {
      if (error instanceof Error) {
        // Eventually, we want to push these errors to an external service.

        // eslint-disable-next-line no-console
        console.log('Middleware error:', error.message);
      }
    }
  };
};
