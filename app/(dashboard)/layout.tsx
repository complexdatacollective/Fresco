import Banner from '~/components/Banner/Banner';
import { NavigationBar } from './dashboard/_components/NavigationBar';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Banner />
      <NavigationBar />
      <div className="h-full">{children}</div>
    </>
  );
};

export default Layout;
