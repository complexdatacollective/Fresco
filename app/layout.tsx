/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import RedirectWrapper from '~/components/RedirectWrapper';
import { api } from '../trpc/server';
import { getServerSession } from '~/utils/auth';
import { Toaster } from '~/components/ui/toaster';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  const { expired, configured } =
    await api.appSettings.get.allappSettings.query(undefined, {
      context: {
        revalidate: 0,
      },
    });

  return (
    <html lang="en">
      <body>
        <RedirectWrapper
          configured={configured}
          expired={expired}
          session={session}
        >
          <Providers initialSession={session}>{children}</Providers>
          <Toaster />
        </RedirectWrapper>
      </body>
    </html>
  );
}

export default RootLayout;
