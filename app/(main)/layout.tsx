import NavigationBar from "~/app/(main)/_components/NavigationBar";

export const metadata = {
  title: "Network Canvas Fresco",
  description: "Fresco.",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationBar />
      <div className="h-full">
        <header className="bg-violet-700 shadow"></header>
        <main className="mx-auto w-[80%] max-w-[1200px]">{children}</main>
      </div>
    </>
  );
}

export default Layout;
