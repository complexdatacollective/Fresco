'use client';

import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { Toaster } from '../ui/toaster';
import DirectionProvider from './DirectionProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <DirectionProvider dir="ltr">
        <DialogProvider>{children}</DialogProvider>
        <Toaster />
      </DirectionProvider>
    </MotionConfig>
  );
}
