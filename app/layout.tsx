/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import { getSetupMetadata } from '~/utils/getSetupMetadata';
import { caller } from './_trpc/caller';
import RedirectWrapper from '~/components/RedirectWrapper';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await caller.session.get();
  const { expired, configured } = await getSetupMetadata();

  console.log('rootlayout', session);

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
