import { NextResponse, type NextRequest } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';
import { proxy } from '~/app/_trpc/client';

const pathIsExpired = (pathname: string) => {
  return pathname === '/expired';
};

export const withExpirationCheck: MiddlewareFactory =
  (next) => async (request: NextRequest, _next) => {
    const { configured, expired } = await proxy.getSetupMetadata.query();

    const pathname = request.nextUrl.pathname;

    console.log('withExpirationCheck', { pathname, configured, expired });

    if (expired && !pathIsExpired(pathname)) {
      console.log('withExpirationCheck', 'expired');
      return NextResponse.redirect(new URL('/expired', request.url));
    }

    return next(request, _next);
  };
