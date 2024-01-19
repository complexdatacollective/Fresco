import { NextFetchEvent, NextRequest } from 'next/server';
import { MiddlewareFactory } from './stackMiddleware';
import { authMiddleware } from '@clerk/nextjs';

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    const auth = authMiddleware({
      publicRoutes: [
        '/interview/finished',
        '/api/analytics',
        '/api/revalidate',
        '/expired',
        '/setup(.*)',
        '/interview(.*)',
      ],
    });

    return auth(request, _next);
  };
};
