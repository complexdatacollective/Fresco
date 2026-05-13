'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { MotionConfig } from 'motion/react';
import { NuqsAdapter as NextNuqsAdapter } from 'nuqs/adapters/next/app';
import { type ComponentType, type ReactNode } from 'react';
import DialogProvider from '@codaco/fresco-ui/dialogs/DialogProvider';
import { DndStoreProvider } from '@codaco/fresco-ui/dnd/dnd';
import { Toaster } from '@codaco/fresco-ui/Toast';
import { TooltipProvider } from '@codaco/fresco-ui/Tooltip';

export default function Providers({
  children,
  disableAnimations,
  nuqsAdapter: NuqsAdapter = NextNuqsAdapter,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
  nuqsAdapter?: ComponentType<{ children: ReactNode }>;
}) {
  if (disableAnimations) {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  }

  return (
    <NuqsAdapter>
      <MotionConfig reducedMotion="user" skipAnimations={disableAnimations}>
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
      </MotionConfig>
    </NuqsAdapter>
  );
}
