import Providers from '~/providers/Providers';
import { NavigationBar } from './_components/NavigationBar';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { getServerSession, requirePageAuth } from '~/utils/auth';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requirePageAuth({ redirectPath: '/dashboard' });

  const initialSession = await getServerSession();

  return (
    <Providers initialSession={initialSession}>
      <NavigationBar />
      <FeedbackBanner />
      {children}
    </Providers>
  );
};

export default Layout;
