'use client';

import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import { Toaster } from '../ui/toaster';
import RadixDirectionProvider from './RadixDirectionProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <RadixDirectionProvider dir="ltr">
        <DndStoreProvider>
          <DialogProvider>{children}</DialogProvider>
        </DndStoreProvider>
        <Toaster />
      </RadixDirectionProvider>
    </MotionConfig>
  );
}
