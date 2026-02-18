'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { MotionConfig } from 'motion/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode } from 'react';
import ProtocolImportProvider from '~/components/ProtocolImport/ProtocolImportProvider';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import { Toaster } from '../ui/Toast';
import { TooltipProvider } from '../ui/tooltip';
import { PostHogIdentify } from './PosthogIdentify';

export default function Providers({
  children,
  disableAnimations,
  installationId,
  disableAnalytics,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
  installationId?: string;
  disableAnalytics?: boolean;
}) {
  return (
    <NuqsAdapter>
      <MotionConfig reducedMotion="user" skipAnimations={!!disableAnimations}>
        <DirectionProvider direction="ltr">
          <Toast.Provider limit={7}>
            <TooltipProvider>
              <DndStoreProvider>
                <ProtocolImportProvider>
                  <PostHogIdentify
                    installationId={installationId}
                    disableAnalytics={disableAnalytics}
                  />
                  <DialogProvider>{children}</DialogProvider>
                </ProtocolImportProvider>
              </DndStoreProvider>
            </TooltipProvider>
            <Toaster />
          </Toast.Provider>
        </DirectionProvider>
      </MotionConfig>
    </NuqsAdapter>
  );
}
