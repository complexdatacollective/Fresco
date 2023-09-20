import '~/styles/globals.scss';
import Providers from './_components/Providers';
import { headers } from 'next/headers';
import { api } from './_trpc/server';
import { redirect } from 'next/navigation';
import type { Session } from 'lucia';
import { cache } from 'react';
import type { Route } from 'next';

// Normal redirect will accept anything, which can easily cause a redirect loop. Use this instead.
const safeRedirect = (url: Route) => {
  redirect(url);
};

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

const routeIsLoginPage = (pathname: Route) => {
  return pathname === '/signin';
};

const routeIsLandingPage = (pathname: Route) => {
  return pathname === '/';
};

const routeIsOnboarding = (pathname: Route) => {
  return pathname === '/onboard';
};

const routeIsInverviewing = (pathname: Route) => {
  return pathname === '/interview';
};

const routeIsExpiredPage = (pathname: Route) => {
  return pathname === '/expired';
};

const calculateRedirect = ({
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
    console.log('no path');
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
      return safeRedirect('/onboard');
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

    console.log('redirecting to login');
    return safeRedirect('/signin');
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

const calculateRedirectCached = cache(calculateRedirect);

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = (await api.getSession.query()) as Session | null;
  const { expired, configured } = await api.getSetupMetadata.query();
  const headersList = headers();
  const path = headersList.get('x-url');

  console.log({ expired, configured });

  calculateRedirect({ session, path, expired, configured });

  return (
    <html lang="en">
      <body>
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
