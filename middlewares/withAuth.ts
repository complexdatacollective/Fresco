import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import { cookies } from 'next/headers';
import { type MiddlewareFactory } from './stackMiddleware';
import { auth } from '~/utils/auth';

export const runtime = 'nodejs';

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    const pathname = request.nextUrl.pathname;

    if (['/dashboard']?.some((path) => pathname.startsWith(path))) {
      // const authRequest = auth.handleRequest({
      //   request,
      //   cookies,
      // });
      // // const session = await authRequest.validate();
      // if (!authRequest) {
      //   const url = new URL(`/api/auth/signin`, request.url);
      //   url.searchParams.set('callbackUrl ', encodeURI(request.url));
      //   return NextResponse.redirect(url);
      // }
    }
    return next(request, _next);
  };
};
