import { NavigationBar } from './_components/NavigationBar';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { requirePageAuth } from '~/utils/auth';
import { requireAppNotExpired } from '~/queries/appSettings';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireAppNotExpired();
  await requirePageAuth();

  return (
    <>
      <NavigationBar />
      <FeedbackBanner />
      {children}
    </>
  );
};

export default Layout;
