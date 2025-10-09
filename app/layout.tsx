import { Quicksand } from 'next/font/google';
import Providers from '~/components/Providers';
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
