/* eslint-disable no-console */
import '~/styles/globals.scss';
import Providers from '../providers/Providers';
import RedirectWrapper from '~/components/RedirectWrapper';
import { getServerSession } from '~/utils/auth';
import { api } from '~/trpc/server';
import { Toaster } from '~/components/ui/toaster';
import { revalidatePath, revalidateTag } from 'next/cache';
import { analytics } from '~/lib/analytics';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

export const dynamic = 'force-dynamic';

async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  const appSettings = await api.appSettings.get.query();

  // If this is the first run, app settings must be created
  if (!appSettings) {
    try {
      await api.appSettings.create.mutate();
    } catch (error) {
      throw new Error(error as string);
    }

    // setInstallationId in analytics provider on first run

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const appSettings = await api.appSettings.get.query();
      if (!appSettings?.installationId) {
        throw new Error('Installation ID is not defined');
      }
      analytics.setInstallationId(appSettings.installationId);
    })();
    revalidateTag('appSettings.get');
    revalidatePath('/');
  }

  // enable analytics if appSettings.allowAnalytics is true
  if (appSettings?.allowAnalytics) {
    analytics.enable();
  }

  return (
    <html lang="en">
      <body>
        <RedirectWrapper
          configured={!!appSettings?.configured}
          expired={!!appSettings?.expired}
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
