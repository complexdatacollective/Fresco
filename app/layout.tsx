import { type Metadata, type Viewport } from 'next';
import { Suspense } from 'react';
import Providers from '~/components/Providers';
import { PostHogIdentify } from '~/components/Providers/PosthogIdentify';
import { env } from '~/env';
import { getDisableAnalytics, getInstallationId } from '~/queries/appSettings';
import '~/styles/globals.css';
import '~/styles/themes/default.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

export const viewport: Viewport = {
  // width: 'device-width',
  // initialScale: 1,
  // maximumScale: 1,
  // userScalable: false,
  viewportFit: 'cover',
};

async function AnalyticsLoader() {
  const [installationId, disableAnalytics] = await Promise.all([
    getInstallationId(),
    getDisableAnalytics(),
  ]);

  return (
    <PostHogIdentify
      installationId={installationId}
      disableAnalytics={disableAnalytics}
    />
  );
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background publish-colors antialiased">
        <div className="root h-dvh">
          <Providers disableAnimations={env.CI ?? false}>
            <Suspense>
              <AnalyticsLoader />
            </Suspense>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}

export default RootLayout;
