import { type ReactElement } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TRPCReactProvider } from '~/trpc/client';
import { SessionProvider } from '~/providers/SessionProvider';
import type { Session } from 'lucia';
import { headers } from 'next/headers';
import PlausibleProvider from 'next-plausible';
import { env } from 'process';
import { api } from '~/trpc/server';

export default async function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}): Promise<ReactElement> {
  const appSettings = await api.appSettings.get.query();

  return (
    <TRPCReactProvider headers={headers()}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SessionProvider session={initialSession}>{children}</SessionProvider>
      <PlausibleProvider
        domain="fresco.networkcanvas.com"
        taggedEvents={true}
        manualPageviews={true}
        trackLocalhost={env.NODE_ENV === 'development' ? true : false}
        enabled={appSettings?.allowAnalytics}
        // for production, add env.NODE_ENV === 'production' to disable tracking in dev
        //enabled={appSettings?.allowAnalytics && env.NODE_ENV === 'production'}
        selfHosted={true}
        customDomain="https://analytics.networkcanvas.dev"
      />
    </TRPCReactProvider>
  );
}
