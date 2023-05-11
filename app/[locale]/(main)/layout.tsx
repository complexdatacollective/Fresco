import NavigationBar from "~/components/layout/NavigationBar";
import Button from "~/ui/components/Button";

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationBar />
      <div className="h-full">
        <header className="bg-violet-700 shadow">
          <div className="mx-auto max-w-7xl  px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Fresco
            </h1>
            <Button>en</Button>
            <Button>es</Button>
          </div>
        </header>
        <main className="mx-auto h-full max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </>
  );
}

export default Layout;
