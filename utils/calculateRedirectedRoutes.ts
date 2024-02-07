/* eslint-disable no-console */
import type { Session } from 'lucia';
import type { Route } from 'next';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import { cache } from 'react';

/**
 * "For non-literal strings, you currently need to manually cast the href with
 * as Route": https://nextjs.org/docs/app/building-your-application/configuring/typescript#statically-typed-links
 *
 * This helper at least makes sure that the first part of the route is valid!
 */
const createRouteWithSearchParams = (
  route: Route,
  searchParams: string,
): Route => {
  return `${route}?${searchParams}` as Route;
};

export const calculateRedirect = ({
  session,
  path,
  searchParams,
  expired,
  configured,
}: {
  session: Session | null;
  path: Route;
  searchParams: ReadonlyURLSearchParams;
  expired: boolean;
  configured: boolean;
}): undefined | Route => {
  // If for some reason we weren't given a path, bail out.
  if (!path) {
    throw new Error('No path provided to calculateRedirect!');
  }

  const isLoginPage = path === '/signin';
  const isLandingPage = path === '/';
  const isOnboarding = path.startsWith('/setup');
  const isInterviewing =
    path.startsWith('/interview') || path.startsWith('/onboard');
  const isExpiredPage = path === '/expired';

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
    // If there's no session, these are the only routes that we pass through:
    if (isLoginPage || isInterviewing) {
      return;
    }

    return createRouteWithSearchParams(
      '/signin',
      'callbackUrl=' + encodeURI(path),
    );
  }

  // APP IS CONFIGURED AND SESSION EXISTS

  // Redirect authed users away from these pages and to the dashboard
  if (isLoginPage || isOnboarding || isLandingPage || isExpiredPage) {
    if (isLoginPage) {
      const callbackUrl = searchParams.get('callbackUrl') as Route;

      if (callbackUrl) {
        return callbackUrl;
      }
    }

    return '/dashboard';
  }

  // APP IS CONFIGURED AND SESSION EXISTS AND USER IS WHERE THEY REQUESTED TO BE
  return;
};

export const calculateRedirectCached = cache(calculateRedirect);
