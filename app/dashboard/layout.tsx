import { getAppSetting, requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import { NavigationBar } from './_components/NavigationBar';
import UploadThingModal from './_components/UploadThingModal';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireAppNotExpired();
  await requirePageAuth();

  const uploadThingToken = await getAppSetting('uploadThingToken');

  return (
    <div className="tablet:gap-16 mb-10 flex flex-col gap-10 px-2">
      <NavigationBar />
      {!uploadThingToken && <UploadThingModal />}
      {children}
    </div>
  );
};

export default Layout;
