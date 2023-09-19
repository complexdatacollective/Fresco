import '~/styles/globals.scss';
import Providers from './_components/Providers';
import { getPageSession } from '~/utils/auth';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getPageSession();

  const headersList = headers();
  const pathname = headersList.get('x-invoke-path') || '';
  console.log('pathname', pathname);

  return (
    <html lang="en">
      <body>
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
