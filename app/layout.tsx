import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
