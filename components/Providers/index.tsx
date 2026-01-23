'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toast } from '@base-ui/react/toast';
import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import ProtocolImportProvider from '~/lib/protocol-import/ProtocolImportProvider';
import { Toaster } from '../ui/Toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
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
  );
}
