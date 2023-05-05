import NavigationBar from "~/components/NavigationBar";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <body className="h-full">
        <NavigationBar />
        <div className="h-full">
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl bg-violet-700 px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Fresco
              </h1>
            </div>
          </header>
          <main className="mx-auto h-full max-w-7xl py-6 sm:px-6 lg:px-8">
            <Providers>{children}</Providers>
          </main>
        </div>
      </body>
    </html>
  );
}

export default RootLayout;
