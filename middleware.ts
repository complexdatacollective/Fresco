import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent, NextMiddleware } from 'next/server';
import { stackMiddlewares } from './utils/stackMiddlewares';
import { getToken } from 'next-auth/jwt';
// import { prisma } from './utils/db';

const localizationMiddleware = (next: NextMiddleware) => createMiddleware({
  locales: ['en', 'es'],
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: 'en'
});

const authMiddleware = (next: NextMiddleware) => async (request: NextRequest, _next: NextFetchEvent) => {
  const pathname = request.nextUrl.pathname;

  if (["/admin"]?.some((path) => pathname.startsWith(path))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const url = new URL(`/signin`, request.url);
      url.searchParams.set("callbackUrl ", encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    if (token.role !== "admin") {
      const url = new URL(`/403`, request.url);
      return NextResponse.rewrite(url);
    }
  }
  return next(request, _next);
};


const middlewares = [localizationMiddleware, authMiddleware];
export default stackMiddlewares(middlewares);

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)']
};


