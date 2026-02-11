'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { MotionConfig, MotionGlobalConfig } from 'motion/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import ProtocolImportProvider from '~/lib/protocol-import/ProtocolImportProvider';
import { Toaster } from '../ui/Toast';

export default function Providers({
  children,
  disableAnimations,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
}) {
  /**
   * This is the documented way to turn of all animations
   * (cannot be done via MotionConfig: https://github.com/motiondivision/motion/issues/3514)
   *
   * Used in CI environments to prevent issues with visual snapshots.
   */
  MotionGlobalConfig.skipAnimations = !!disableAnimations;

  return (
    <NuqsAdapter>
      <MotionConfig reducedMotion="user">
        <DirectionProvider direction="ltr">
          <Toast.Provider limit={7}>
            <DndStoreProvider>
              <ProtocolImportProvider>
                <DialogProvider>{children}</DialogProvider>
              </ProtocolImportProvider>
            </DndStoreProvider>
            <Toaster />
          </Toast.Provider>
        </DirectionProvider>
      </MotionConfig>
    </NuqsAdapter>
  );
}
