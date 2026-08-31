import { type Metadata, type Viewport } from 'next';
import { Suspense } from 'react';

import Providers from '~/components/Providers';
import AnalyticsLoader from '~/components/Providers/AnalyticsLoader';
import { env } from '~/env';

import '@codaco/tailwind-config/fonts/inclusive-sans.css';
import '@codaco/tailwind-config/fonts/nunito.css';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
};

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
