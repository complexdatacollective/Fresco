import { NextResponse, type NextRequest } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';
import { proxy } from '~/app/_trpc/proxy';

const routeIsLoginPage = (pathname: string) => {
  return pathname === '/signin';
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

const routeIsExpiredPage = (pathname: string) => {
  return pathname === '/expired';
};

export const withAuth: MiddlewareFactory =
  (next) => async (request: NextRequest, _next) => {
    const pathname = request.nextUrl.pathname;
    const isLoginPage = routeIsLoginPage(pathname);
    const isLandingPage = routeIsLandingPage(pathname);
    const isOnboarding = routeIsOnboarding(pathname);
    const isInverviewing = routeIsInverviewing(pathname);
    const isExpiredPage = routeIsExpiredPage(pathname);

    const res = await next(request, _next);

    console.log('withAuth', {
      pathname,
      isLoginPage,
      isLandingPage,
      isOnboarding,
      isInverviewing,
      isExpiredPage,
    });

    // If requesting the onboarding or interview routes, auth doesn't matter.
    if (isOnboarding || isInverviewing) {
      console.log('withAuth', 'onboarding or interviewing');
      return res;
    }

    const session = await proxy.getSession.query();

    console.log('withAuth', session);

    // Redirect authenticated users to the dashboard when they hit the landing page
    // or the login page, or the expired page
    if (session) {
      console.log('withAuth', 'session found', session);
      if (isLandingPage || isLoginPage) {
        console.log('withAuth', 'redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return res;
    }

    // UNAUTHENTICATED USER
    if (!isLoginPage) {
      console.log('withAuth', 'redirecting to login');
      // No session found - redirect to login page, with callback to current page
      const url = new URL(`/signin`, request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    // If we get here, an unauthorized user is requesting the login page directly
    console.log('withAuth', 'unauthenticated requesting login');
    return res;
  };
