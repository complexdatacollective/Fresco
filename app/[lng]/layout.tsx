import "../globals.css";
import Providers from "../providers";
import { languages } from "../i18n/settings";

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function RootLayout({ children }: { children: React.ReactNode }, lng: string ) {
  return (
    <html lang={lng} className="h-full bg-gray-100">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
