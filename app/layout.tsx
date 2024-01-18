import { revalidatePath, revalidateTag } from 'next/cache';
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

function RootLayout({ children }: { children: React.ReactNode }) {
  // const session = await getServerSession();
  // const appSettings = await api.appSettings.get.query();

  // If this is the first run, app settings must be created
  // if (!appSettings) {
  //   await api.appSettings.create.mutate();
  //   revalidateTag('appSettings.get');
  //   revalidatePath('/');
  // }

  return (
    <html lang="en" className="">
      <body className="bg-slate-100">
        <Providers initialSession={null}>
          {/* <RedirectWrapper configured expired={false}> */}
          <Banner />
          {children}
          {/* </RedirectWrapper> */}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

export default RootLayout;
