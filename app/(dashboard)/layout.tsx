export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="h-full">
        <header className="bg-violet-700 shadow"></header>
        <main className="mx-auto w-[80%] max-w-[1200px]">{children}</main>
      </div>
    </>
  );
}

export default Layout;
