/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import RedirectWrapper from '~/components/RedirectWrapper';
import { getServerSession } from '~/utils/auth';
import { api } from '~/trpc/server';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

export const revalidate = false;
export const runtime = 'nodejs';

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  const { configured, expired } =
    await api.appSettings.get.allappSettings.query();

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
