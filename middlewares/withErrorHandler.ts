import type { NextFetchEvent, NextRequest } from 'next/server';
import type { MiddlewareFactory } from './stackMiddleware';

export const withErrorHandler: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    try {
      await next(request, _next);
    } catch (error) {
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.log('withErrorHandler', error.message);
      }
    }
  };
};
