import '~/styles/globals.scss';
import Providers from './_components/Providers';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
