import { connection } from 'next/server';
import { Suspense } from 'react';
import { getAppSetting } from '~/queries/appSettings';
import { NavigationBar } from './_components/NavigationBar';
import UploadThingModal from './_components/UploadThingModal';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="tablet:gap-16 tablet:px-6 laptop:px-12 mb-10 flex max-h-screen flex-col gap-10 overflow-y-auto px-2 pb-10 [scrollbar-gutter:stable_both-edges]">
      <NavigationBar />
      <Suspense fallback={null}>
        <UploadThingTokenGate />
      </Suspense>
      {children}
    </div>
  );
};

async function UploadThingTokenGate() {
  await connection();
  const uploadThingToken = await getAppSetting('uploadThingToken');
  if (!uploadThingToken) return <UploadThingModal />;
  return null;
}

export default Layout;
