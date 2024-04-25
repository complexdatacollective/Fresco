import { redirect } from 'next/navigation';
import { NavigationBar } from './_components/NavigationBar';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getServerSession } from '~/utils/auth';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const { session } = await getServerSession();

  if (!session) {
    console.log('layout: no session, redirecting.');
    redirect('/signin');
  }

  return (
    <>
      <NavigationBar />
      <FeedbackBanner />
      {children}
    </>
  );
};

export default Layout;
