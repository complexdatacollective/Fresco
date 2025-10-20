import { Quicksand } from 'next/font/google';
import Providers from '~/components/Providers';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { Toaster } from '~/components/ui/toaster';
import { env } from '~/env';
import '~/styles/globals.css';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

const quicksand = Quicksand({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.className} bg-background bg-scope antialiased`}
      >
        <div className="root isolate">
          <Providers>{children}</Providers>
          <Toaster />
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
