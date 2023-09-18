import { type NextRequest, NextResponse } from 'next/server';
import { type MiddlewareFactory } from './stackMiddleware';
import { auth } from '~/utils/auth';

const routeIsLoginOrSignup = (pathname: string) => {
  return pathname === '/signin' || pathname === '/signup';
};

const routeIsLandingPage = (pathname: string) => {
  return pathname === '/';
};

export const withAuth: MiddlewareFactory =
  (next) => async (request: NextRequest, _next) => {
    const pathname = request.nextUrl.pathname;
    const isLoginOrSignup = routeIsLoginOrSignup(pathname);
    const isLandingPage = routeIsLandingPage(pathname);
    const authCookie = request.cookies.get('auth_session');
    if (authCookie) {
      const session = await auth.getSession(authCookie.value);
      // Logged in and trying to access landing page
      if (session.user && isLandingPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Logged in and trying to access login or signup page
      if (session && isLoginOrSignup) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // // Logged out and trying to access a logged in page
      if (!session && !isLoginOrSignup) {
        return NextResponse.redirect(new URL('/signin', request.url));
      }
    } else if (!isLoginOrSignup) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    return next(request, _next);
  };
