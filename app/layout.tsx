import { type Metadata } from 'next';
import Providers from '~/components/Providers';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { env } from '~/env';
import { getDisableAnalytics, getInstallationId } from '~/queries/appSettings';
import '~/styles/globals.css';
import '~/styles/themes/default.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  const [installationId, disableAnalytics] = await Promise.all([
    getInstallationId(),
    getDisableAnalytics(),
  ]);

  return (
    <html lang="en">
      <body className="bg-background publish-colors antialiased">
        <div className="root h-dvh">
          <Providers
            disableAnimations={env.CI ?? false}
            installationId={installationId}
            disableAnalytics={disableAnalytics}
          >
            {children}
          </Providers>
          {env.SANDBOX_MODE && (
            <ResponsiveContainer>
              <footer className="z-1 flex justify-center py-4">
                <a href="https://www.netlify.com">
                  <img
                    src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
                    alt="Deploys by Netlify"
                  />
                </a>
              </footer>
            </ResponsiveContainer>
          )}
        </div>
      </body>
    </html>
  );
}

export default RootLayout;
