import { Toaster } from '~/components/ui/toaster';
import '~/styles/globals.scss';
import { Quicksand } from 'next/font/google';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

const poppins = Quicksand({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

export default RootLayout;
