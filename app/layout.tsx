/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import RedirectWrapper from '~/components/RedirectWrapper';
import { Suspense } from 'react';
import { trpc } from './_trpc/proxy';
import type { Session } from 'lucia';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = (await trpc.session.get.query()) as Session | null;
  const { expired, configured } =
    await trpc.metadata.get.allSetupMetadata.query();

  return (
    <html lang="en">
      <body>
        <RedirectWrapper
          configured={configured}
          expired={expired}
          session={session}
        >
          <Providers initialSession={session}>{children}</Providers>
        </RedirectWrapper>
      </body>
    </html>
  );
}

export default RootLayout;
