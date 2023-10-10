/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import RedirectWrapper from '~/components/RedirectWrapper';
import { trpc } from './_trpc/server';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await trpc.session.get.query(undefined, {
    context: {
      revalidate: 0,
    },
  });

  const { expired, configured } =
    await trpc.appSettings.get.allappSettings.query(undefined, {
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
        </RedirectWrapper>
      </body>
    </html>
  );
}

export default RootLayout;
