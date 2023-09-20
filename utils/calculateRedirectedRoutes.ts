/* eslint-disable no-console */
import type { Session } from 'lucia';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Normal redirect will accept anything, which can easily cause a redirect loop. Use this instead.
export const safeRedirect = (url: Route) => {
  return redirect(url);
};

const routeIsLoginPage = (pathname: Route) => {
  return pathname === '/signin';
};

const routeIsLandingPage = (pathname: Route) => {
  return pathname === '/';
};

const routeIsOnboarding = (pathname: Route) => {
  return pathname === '/setup';
};

const routeIsInverviewing = (pathname: Route) => {
  return pathname === '/interview';
};

const routeIsExpiredPage = (pathname: Route) => {
  return pathname === '/expired';
};

export const calculateRedirect = ({
  session,
  path,
  expired,
  configured,
}: {
  session: Session | null;
  path: string | null;
  expired: boolean;
  configured: boolean;
}) => {
  // If for some reason we couldn't get the path from the headers, bail out.
  if (!path) {
    return;
  }

  const pathUrl = new URL(path);

  const pathname = pathUrl.pathname as Route;
  const isLoginPage = routeIsLoginPage(pathname);
  const isLandingPage = routeIsLandingPage(pathname);
  const isOnboarding = routeIsOnboarding(pathname);
  const isInverviewing = routeIsInverviewing(pathname);
  const isExpiredPage = routeIsExpiredPage(pathname);

  /**
   * `configured` - setup has been completed
   * `expired` - the setup window has expired. always false if configured is true.
   */

  if (expired) {
    console.log('app is expired');

    if (isExpiredPage) {
      console.log('already on expired page');
      return;
    }

    console.log('redirecting to expired');
    return safeRedirect('/expired');
  }

  // APP IS NOT EXPIRED
  // If not configured, but not expired, redirect to onboard.
  if (!configured) {
    console.log('app is not configured');

    if (!isOnboarding) {
      console.log('redirecting to onboard');
      return safeRedirect('/setup');
    }

    console.log('already on onboard page');
    return;
  }

  // APP IS CONFIGURED
  console.log('app is configured');

  if (!session) {
    console.log('no session');

    if (isLoginPage) {
      console.log('already on login page');
      return;
    }

    if (isInverviewing) {
      console.log('on interviewing page. no auth required');
      return;
    }

    console.log('redirecting to login', path, encodeURI(path));
    return safeRedirect('/signin?callbackUrl=' + encodeURI(path));
  }

  // APP IS CONFIGURED AND SESSION EXISTS

  // Redirect authed users away from these pages and to the dashboard
  if (isLoginPage || isOnboarding || isLandingPage || isExpiredPage) {
    console.log('redirecting to dashboard');
    return safeRedirect('/dashboard');
  }

  // APP IS CONFIGURED AND SESSION EXISTS AND USER IS ON DASHBOARD
  console.log('app is configured and session exists and user is on dashboard');
  return;
};

export const calculateRedirectCached = cache(calculateRedirect);
