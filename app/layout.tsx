/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import { headers } from 'next/headers';
import { getSetupMetadata } from '~/utils/getSetupMetadata';
import { calculateRedirect } from '~/utils/calculateRedirectedRoutes';
import { api } from './_trpc/server';
import { caller } from './_trpc/caller';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  // const session = await api.session.get.query();
  const session = await caller.session.get();
  const { expired, configured } = await getSetupMetadata();
  const headersList = headers();
  const path = headersList.get('x-url');

  console.log('rootlayout', session);

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
