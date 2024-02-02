import { NavigationBar } from './dashboard/_components/NavigationBar';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NavigationBar />
      <FeedbackBanner />
      {children}
    </>
  );
};

export default Layout;
