import { revalidatePath, revalidateTag } from 'next/cache';
import RedirectWrapper from '~/components/RedirectWrapper';
import { Toaster } from '~/components/ui/toaster';
import '~/styles/globals.scss';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import Providers from '../providers/Providers';
import { Quicksand } from 'next/font/google';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

const poppins = Quicksand({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const appSettings = await api.appSettings.get.query();

  // If this is the first run, app settings must be created
  if (!appSettings) {
    await api.appSettings.create.mutate();
    revalidateTag('appSettings.get');
    revalidatePath('/');
  }

  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Providers initialSession={session}>
          <RedirectWrapper
            configured={!!appSettings?.configured}
            expired={!!appSettings?.expired}
            session={session}
          >
            {children}
            <Toaster />
          </RedirectWrapper>
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;
