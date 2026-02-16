import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';
import { NavigationBar } from './_components/NavigationBar';
import UploadThingModal from './_components/UploadThingModal';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="tablet:gap-16 tablet:px-6 laptop:px-12 mb-10 flex h-full flex-col gap-10 overflow-y-auto px-2 pb-10 [scrollbar-gutter:stable_both-edges]">
      <NavigationBar />
      <Suspense fallback={null}>
        <UploadThingTokenGate />
      </Suspense>
      {children}
      {env.SANDBOX_MODE && (
        <ResponsiveContainer>
          <footer className="z-1 flex justify-center py-4">
            <a href="https://www.netlify.com">
              <img
                src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
                alt="Deploys by Netlify"
              />
            </a>
          </footer>
        </ResponsiveContainer>
      )}
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
