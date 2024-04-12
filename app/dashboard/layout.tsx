import Providers from '~/providers/Providers';
import { NavigationBar } from './_components/NavigationBar';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getServerSession } from '~/utils/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const initialSession = await getServerSession();

  if (!initialSession) {
    redirect('/signin');
  }

  return (
    <Providers initialSession={initialSession}>
      <NavigationBar />
      <FeedbackBanner />
      {children}
    </Providers>
  );
};

export default Layout;
