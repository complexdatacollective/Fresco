import { env } from '~/env';
import AlertBanner from '~/lib/interviewer/components/AlertBanner';
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
    <>
      <NavigationBar previewMode={env.PREVIEW_MODE} />
      {env.PREVIEW_MODE && (
        <AlertBanner>
          <strong>Preview Mode </strong>- Protocol, participant, and interview
          management are disabled.
        </AlertBanner>
      )}
      {!uploadThingToken && <UploadThingModal />}

      {children}
    </>
  );
};

export default Layout;
