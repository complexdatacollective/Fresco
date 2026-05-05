import { type Metadata, type Viewport } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import Providers from '~/components/Providers';
import { PostHogIdentify } from '~/components/Providers/PosthogIdentify';
import { env } from '~/env';
import { getDisableAnalytics, getInstallationId } from '~/queries/appSettings';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
};

async function AnalyticsLoader() {
  // Opt this subtree out of prerendering — getInstallationId and
  // getDisableAnalytics can fall back to the database, which isn't
  // available at build time (e.g. when building the distributable
  // Docker image). The <Suspense> boundary in RootLayout lets Next
  // stream this in at request time instead.
  await connection();

  try {
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
  } catch {
    return null;
  }
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background publish-colors antialiased">
        <div className="root min-h-dvh">
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
