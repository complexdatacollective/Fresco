import Providers from '~/components/Providers';
import { ServiceWorkerRegistration } from '~/components/pwa/ServiceWorkerRegistration';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { env } from '~/env';
import '~/styles/globals.css';
import '~/styles/themes/default.css';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
  manifest: '/manifest.json',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background publish-colors antialiased">
        <ServiceWorkerRegistration />
        <div className="root">
          <Providers disableAnimations={env.CI ?? false}>{children}</Providers>
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
