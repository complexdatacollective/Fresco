'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { MotionConfig } from 'motion/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode } from 'react';
import ProtocolImportProvider from '~/components/ProtocolImport/ProtocolImportProvider';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import { InterviewToastViewport } from '~/lib/interviewer/components/InterviewToast';
import { interviewToastManager } from '~/lib/interviewer/components/interviewToastManager';
import { Toaster } from '../ui/Toast';
import { TooltipProvider } from '../ui/tooltip';

export default function Providers({
  children,
  disableAnimations,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
}) {
  return (
    <NuqsAdapter>
      <MotionConfig reducedMotion="user" skipAnimations={!!disableAnimations}>
        <DirectionProvider direction="ltr">
          <Toast.Provider limit={7}>
            <TooltipProvider>
              <DndStoreProvider>
                <ProtocolImportProvider>
                  <DialogProvider>{children}</DialogProvider>
                </ProtocolImportProvider>
              </DndStoreProvider>
            </TooltipProvider>
            <Toaster />
          </Toast.Provider>
          <Toast.Provider toastManager={interviewToastManager} limit={3}>
            <InterviewToastViewport />
          </Toast.Provider>
        </DirectionProvider>
      </MotionConfig>
    </NuqsAdapter>
  );
}
