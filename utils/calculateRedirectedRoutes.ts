/* eslint-disable no-console */
import type { Session } from 'lucia';
import type { Route } from 'next';
import { cache } from 'react';

const routeIsLoginPage = (pathname: Route) => {
  return pathname === '/signin';
};

const routeIsLandingPage = (pathname: Route) => {
  return pathname === '/';
};

const routeIsOnboarding = (pathname: Route) => {
  return pathname === '/setup';
};

const routeIsInterviewing = (pathname: Route) => {
  return pathname.startsWith('/interview');
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
  path: Route;
  expired: boolean;
  configured: boolean;
}): undefined | Route => {
  // If for some reason we weren't given a path, bail out.
  if (!path) {
    throw new Error('No path provided to calculateRedirect!');
  }

  const isLoginPage = routeIsLoginPage(path);
  const isLandingPage = routeIsLandingPage(path);
  const isOnboarding = routeIsOnboarding(path);
  const isInterviewing = routeIsInterviewing(path);
  const isExpiredPage = routeIsExpiredPage(path);

  /**
   * `configured` - setup has been completed
   * `expired` - the setup window has expired. always false if configured is true.
   */

  if (expired) {
    if (!isExpiredPage) {
      return '/expired';
    }

    return;
  }

  // APP IS NOT EXPIRED
  // If not configured, but not expired, redirect to onboard.
  if (!configured) {
    if (!isOnboarding) {
      return '/setup';
    }

    return;
  }

  // APP IS CONFIGURED
  if (!session) {
    if (isLoginPage) {
      return;
    }

    if (isInterviewing) {
      return;
    }

    return ('/signin?callbackUrl=' + encodeURI(path)) as Route;
  }

  // APP IS CONFIGURED AND SESSION EXISTS

  // Redirect authed users away from these pages and to the dashboard
  if (isLoginPage || isOnboarding || isLandingPage || isExpiredPage) {
    return '/dashboard';
  }

  // APP IS CONFIGURED AND SESSION EXISTS AND USER IS ON DASHBOARD
  return;
};

export const calculateRedirectCached = cache(calculateRedirect);
