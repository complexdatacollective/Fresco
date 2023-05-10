import "./globals.css";
import Providers from "./providers";
import {useLocale} from 'next-intl';

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  return (
    <html lang={locale} className="h-full bg-gray-100">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
