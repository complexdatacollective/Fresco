import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import NetlifyBadge from '~/components/NetlifyBadge';
import { ExportProgressProvider } from '~/components/ExportProgressProvider';
import { getAppSetting } from '~/queries/appSettings';
import { NavigationBar } from './_components/NavigationBar';
import UploadThingModal from './_components/UploadThingModal';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      data-testid="dashboard-layout"
      className="tablet-landscape:gap-16 tablet-landscape:px-6 laptop:px-12 flex h-dvh flex-col gap-10 overflow-y-auto px-2 pb-10 scrollbar-gutter-both"
    >
      <NavigationBar />
      <Suspense fallback={null}>
        <UploadThingTokenGate />
      </Suspense>
      <ExportProgressProvider>{children}</ExportProgressProvider>
      <NetlifyBadge />
    </div>
  );
};

async function UploadThingTokenGate() {
  await connection();
  const storageProvider = await getAppSetting('storageProvider');
  if (storageProvider === 's3') return null;
  const uploadThingToken = await getAppSetting('uploadThingToken');
  if (!uploadThingToken) return <UploadThingModal />;
  return null;
}

export default Layout;
