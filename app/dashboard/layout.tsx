import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { defineMessages } from '@codaco/app-i18n/messages';
import { ExportProgressProvider } from '~/components/ExportProgressProvider';
import NetlifyBadge from '~/components/NetlifyBadge';
import { env } from '~/env';
import { getServerIntl } from '~/i18n/server';
import { getAppSetting } from '~/queries/appSettings';
import { getStorageProvider } from '~/queries/storageProvider';

import { NavigationBar } from './_components/NavigationBar';
import UploadThingModal from './_components/UploadThingModal';

export async function generateMetadata(): Promise<Metadata> {
  const intl = await getServerIntl();
  return {
    title: intl.formatMessage(messages.pageTitle),
    description: intl.formatMessage(messages.pageDescription),
  };
}

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
      {env.SANDBOX_MODE && <NetlifyBadge />}
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

const messages = defineMessages({
  pageDescription: {
    id: 'fresco.dashboard.metadata.pageDescription',
    defaultMessage: 'Fresco.',
    description: 'Researcher-facing dashboard.metadata: Fresco.',
  },

  pageTitle: {
    id: 'fresco.dashboard.metadata.pageTitle',
    defaultMessage: 'Network Canvas Fresco - Dashboard',
    description:
      'Researcher-facing dashboard.metadata: Network Canvas Fresco - Dashboard',
  },
});
