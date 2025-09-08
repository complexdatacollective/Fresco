import { MotionConfig } from 'motion/react';
import { type ReactNode } from 'react';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import { Toaster } from '../ui/toaster';
import RadixDirectionProvider from './RadixDirectionProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <RadixDirectionProvider dir="ltr">
        <DialogProvider>{children}</DialogProvider>
        <Toaster />
      </RadixDirectionProvider>
    </MotionConfig>
  );
}
