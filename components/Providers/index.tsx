'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { NuqsAdapter as NextNuqsAdapter } from 'nuqs/adapters/next/app';
import { type ComponentType, type ReactNode } from 'react';

import { AnimationProvider } from '@codaco/fresco-ui/AnimationProvider';
import DialogProvider from '@codaco/fresco-ui/dialogs/DialogProvider';
import { DndStoreProvider } from '@codaco/fresco-ui/dnd/dnd';
import { Toaster } from '@codaco/fresco-ui/Toast';
import { TooltipProvider } from '@codaco/fresco-ui/Tooltip';

export default function Providers({
  children,
  disableAnimations,
  disableAnimationsForAutomation,
  nuqsAdapter: NuqsAdapter = NextNuqsAdapter,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
  disableAnimationsForAutomation?: boolean;
  nuqsAdapter?: ComponentType<{ children: ReactNode }>;
}) {
  return (
    <NuqsAdapter>
      <AnimationProvider
        disableAnimations={disableAnimations}
        disableAnimationsForAutomation={disableAnimationsForAutomation}
      >
        <DirectionProvider direction="ltr">
          <Toast.Provider limit={7}>
            <TooltipProvider>
              <DndStoreProvider>
                <DialogProvider>{children}</DialogProvider>
              </DndStoreProvider>
            </TooltipProvider>
            <Toaster />
          </Toast.Provider>
        </DirectionProvider>
      </AnimationProvider>
    </NuqsAdapter>
  );
}
