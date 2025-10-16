'use client';

import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { FormStoreProvider } from '~/lib/form/store/formStoreProvider';
import { Toaster } from '../ui/toaster';
import RadixDirectionProvider from './RadixDirectionProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <RadixDirectionProvider dir="ltr">
        <FormStoreProvider>
          <DialogProvider>{children}</DialogProvider>
        </FormStoreProvider>
        <Toaster />
      </RadixDirectionProvider>
    </MotionConfig>
  );
}
