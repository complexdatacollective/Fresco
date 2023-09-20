import '~/styles/globals.scss';
import Providers from './_components/Providers';
import { headers } from 'next/headers';
import { api } from './_trpc/server';
import { redirect } from 'next/navigation';
import { proxy } from '~/app/_trpc/proxy';
import { Session } from 'lucia';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

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

const calculateRedirect = ({
  session,
  path,
  expired,
  configured,
}: {
  session: Session | null;
  path: string;
  expired: boolean;
  configured: boolean;
}) => {
  const pathUrl = new URL(path);

  if (!pathUrl) {
    console.log('Couldnt do path url');
    return;
  }

  const pathname = pathUrl.pathname;
  const isLoginPage = routeIsLoginPage(pathname);
  const isLandingPage = routeIsLandingPage(pathname);
  const isOnboarding = routeIsOnboarding(pathname);
  const isInverviewing = routeIsInverviewing(pathname);
  const isExpiredPage = routeIsExpiredPage(pathname);

  // If the app is configured, do nothing.
  if (configured) {
    console.log('app is configured');

    if (session) {
      console.log('session exists');

      if (isLoginPage || isOnboarding || isLandingPage || isExpiredPage) {
        console.log('redirecting to dashboard');
        return redirect('/dashboard');
      }

      console.log('configured, session exists, not onboarding. do nothing.');
      return;
    }
  }

  // If the app is unconfigured, but not expired, redirect to onboard.
  if (!expired && !isExpiredPage) {
    console.log('redirecting to onboard');
    return redirect('/onboard');
  }

  if (expired && !isExpiredPage) {
    console.log('redirecting to expired');
    return redirect('/expired');
  }
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await api.getSession.query();
  const { expired, configured } = await api.getSetupMetadata.query();
  const headersList = headers();
  const path = headersList.get('x-url');

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
