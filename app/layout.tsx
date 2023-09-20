/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from './_components/Providers';
import { headers } from 'next/headers';
import { getSetupMetadata } from '~/utils/getSetupMetadata';
import { getPageSession } from '~/utils/auth';
import { calculateRedirect } from '~/utils/calculateRedirectedRoutes';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getPageSession();
  const { expired, configured } = await getSetupMetadata();
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
