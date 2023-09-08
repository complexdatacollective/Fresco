import { redirect } from 'next/navigation';
import { getPageSession } from '~/utils/getPageSession';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getPageSession();

  if (!session) {
    console.log('no session');
    redirect('/signin');
  }

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