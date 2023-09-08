import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';
import { auth } from '~/utils/auth';

/**
 * TODO: fix this!
 * Seems like the only approach i can take is to use a fetch request here
 * that handles the db/auth stuff, since this isn't limited to the edge
 * runtime.
 */

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    const pathname = request.nextUrl.pathname;

    if (['/dashboard']?.some((path) => pathname.startsWith(path))) {
      const url = request.nextUrl.clone();
      url.pathname = '/api/auth/verify';
      const verify = await fetch(url, {
        method: 'POST',
      });

      console.log('verify', verify);

      // const session = await authRequest.validate();
      if (!verify) {
        url.pathname = '/api/auth/signin';
        url.searchParams.set('callbackUrl ', encodeURI(request.url));
        return NextResponse.redirect(url);
      }
    }
    return next(request, _next);
  };
};
