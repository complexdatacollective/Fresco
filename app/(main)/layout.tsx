import NavigationBar from '~/components/layout/NavigationBar';

export const metadata = {
  title: 'Network Canvas Fresco',
  description: 'Fresco.',
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationBar />
      <div className="h-full">
        <header className="bg-violet-700 shadow"></header>
        <main className="mx-auto h-full max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </>
  );
}

export default Layout;
