import { type Metadata, type Viewport } from 'next';
import { Suspense } from 'react';

import Providers from '~/components/Providers';
import AnalyticsLoader from '~/components/Providers/AnalyticsLoader';
import { env } from '~/env';
import { FrescoI18nProvider } from '~/i18n/FrescoI18nProvider';
import { getFrescoI18nInitialization } from '~/i18n/server';
import { frescoCatalogSource } from '~/src/locales/catalogs';

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
    <Suspense fallback={null}>
      <LocalizedRoot>{children}</LocalizedRoot>
    </Suspense>
  );
}

async function LocalizedRoot({ children }: { children: React.ReactNode }) {
  const initial = await getFrescoI18nInitialization();
  // Passed down rather than loaded by the client provider, so the request's
  // language is in the server render and hydration downloads nothing.
  const messages = await frescoCatalogSource.load(initial.locale);
  return (
    <html lang={initial.locale} dir="ltr">
      <body className="bg-background publish-colors antialiased">
        <div className="root min-h-dvh">
          <FrescoI18nProvider initial={initial} messages={messages}>
            <Providers disableAnimations={env.CI ?? false}>
              <Suspense>
                <AnalyticsLoader />
              </Suspense>
              {children}
            </Providers>
          </FrescoI18nProvider>
        </div>
      </body>
    </html>
  );
}

export default RootLayout;
