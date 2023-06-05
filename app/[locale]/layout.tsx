import { PropsWithChildren } from "react";
import "../globals.css";
import Providers from "./providers";
import { useLocale } from "next-intl";

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function RootLayout({ children }: PropsWithChildren) {
  const locale = useLocale();

  return (
    <html lang={locale} className="h-full bg-gray-100">
      <body className="h-full">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
