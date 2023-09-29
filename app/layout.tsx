/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../components/Providers';
import { headers } from 'next/headers';
import { getSetupMetadata } from '~/utils/getSetupMetadata';
import { trpcRscHTTP } from './_trpc/server';
import RedirectWrapper from '~/components/RedirectWrapper';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await trpcRscHTTP.session.get.query();
  const { expired, configured } = await getSetupMetadata();

  console.log('root session', !!session);

  return (
    <html lang="en">
      <body>
        <RedirectWrapper
          session={session}
          expired={expired}
          configured={configured}
        >
          <Providers initialSession={session} headers={headers()}>
            {children}
          </Providers>
        </RedirectWrapper>
      </body>
    </html>
  );
}

export default RootLayout;
