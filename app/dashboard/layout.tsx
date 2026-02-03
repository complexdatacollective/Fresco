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
    <div className="tablet:gap-16 tablet:px-6 laptop:px-12 mb-10 flex max-h-screen flex-col gap-10 overflow-y-auto px-2 [scrollbar-gutter:stable_both-edges]">
      <NavigationBar />
      {!uploadThingToken && <UploadThingModal />}
      {children}
    </div>
  );
};

export default Layout;
