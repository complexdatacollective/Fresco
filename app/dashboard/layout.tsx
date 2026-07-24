import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import NetlifyBadge from '~/components/NetlifyBadge';
import { ExportProgressProvider } from '~/components/ExportProgressProvider';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';
import { getStorageProvider } from '~/queries/storageProvider';
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
      className="tablet-landscape:gap-16 tablet-landscape:px-6 laptop:px-12 flex h-dvh scrollbar-gutter-both flex-col gap-10 overflow-y-auto px-2 pb-10"
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
  const storageProvider = await getStorageProvider();
  if (storageProvider === 's3') return null;
  const uploadThingToken =
    env.UPLOADTHING_TOKEN ?? (await getAppSetting('uploadThingToken'));
  if (!uploadThingToken) return <UploadThingModal />;
  return null;
}

export default Layout;
