import { MotionConfig } from 'motion/react';
import { Quicksand } from 'next/font/google';
import { Toaster } from '~/components/ui/toaster';
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
      <body className={`${quicksand.className} antialiased`}>
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster />
        </MotionConfig>
      </body>
    </html>
  );
}

export default RootLayout;
