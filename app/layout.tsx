import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import Banner from '~/components/Banner/Banner';
import RedirectWrapper from '~/components/RedirectWrapper';
import { Toaster } from '~/components/ui/toaster';
import '~/styles/globals.scss';
import { api } from '~/trpc/server';
import Providers from '../providers/Providers';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const appSettings = await api.appSettings.get.query();

  // If this is the first run, app settings must be created
  if (!appSettings) {
    // eslint-disable-next-line no-console
    console.log('💥 Creating app settings...');
    await api.appSettings.create.mutate();
    revalidateTag('appSettings.get');
    revalidatePath('/');
  }

  return (
    <html lang="en" className="">
      <body className="bg-slate-100">
        <Providers>
          <RedirectWrapper
            configured={!!appSettings?.configured}
            expired={!!appSettings?.expired}
          >
            <Banner />
            {children}
          </RedirectWrapper>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

export default RootLayout;
