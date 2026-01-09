'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import { Toaster } from '../ui/toaster';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <DirectionProvider direction="ltr">
        <DndStoreProvider>
          <DialogProvider>{children}</DialogProvider>
        </DndStoreProvider>
        <Toaster />
      </DirectionProvider>
    </MotionConfig>
  );
}
