'use client';

import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { DndStoreProvider } from '~/lib/dnd';
import { FormStoreProvider } from '~/lib/form/store/formStoreProvider';
import { Toaster } from '../ui/toaster';
import RadixDirectionProvider from './DirectionProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <RadixDirectionProvider dir="ltr">
        <DndStoreProvider>
          <FormStoreProvider>
            <DialogProvider>{children}</DialogProvider>
          </FormStoreProvider>
        </DndStoreProvider>
        <Toaster />
      </RadixDirectionProvider>
    </MotionConfig>
  );
}
