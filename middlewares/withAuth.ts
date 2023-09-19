import { NextResponse, type NextRequest } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';
import { api } from '~/app/_trpc/server';
import { proxy } from '~/app/_trpc/client';

const routeIsLoginOrSignup = (pathname: string) => {
  return pathname === '/signin' || pathname === '/signup';
};

const routeIsLandingPage = (pathname: string) => {
  return pathname === '/';
};

const routeIsOnboarding = (pathname: string) => {
  return pathname === '/onboarding';
};

const routeIsInverviewing = (pathname: string) => {
  return pathname === '/interviewing';
};

export const withAuth: MiddlewareFactory =
  (next) => async (request: NextRequest, _next) => {
    const pathname = request.nextUrl.pathname;
    const isLoginOrSignup = routeIsLoginOrSignup(pathname);
    const isLandingPage = routeIsLandingPage(pathname);
    const isOnboarding = routeIsOnboarding(pathname);
    const isInverviewing = routeIsInverviewing(pathname);

    if (isOnboarding || isInverviewing) {
      return next(request, _next);
    }

    const session = await proxy.getSession.query();

    if (session) {
      if (isLandingPage || isLoginOrSignup) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return next(request, _next);
    }

    NextResponse.redirect(new URL('/signin', request.url));

    return next(request, _next);
  };
