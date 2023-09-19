import '~/styles/globals.scss';
import Providers from './_components/Providers';
import getSetupMetadata from '~/utils/getSetupMetadata';
import { redirect } from 'next/navigation';
import { getPageSession } from '~/utils/auth';
import { cache } from 'react';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

const getSetupMetadataCached = cache(getSetupMetadata);

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getPageSession();
  const setupMetadata = await getSetupMetadataCached();

  if (session && setupMetadata.configured) {
    console.log('onboard layout: session exists. redirecting.');
    redirect('/dashboard');
  }

  const configExpired: boolean =
    Date.now() - setupMetadata.initializedAt.getTime() > 300000;
  if (!setupMetadata.configured && configExpired) {
    redirect('/?step=expired');
  }
  return (
    <html lang="en">
      <body>
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
