import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';
import { DialogBackdrop } from '~/lib/dialogs/DialogBackdrop';

export default function Modal({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <BaseDialog.Portal keepMounted container={document.body}>
            <DialogBackdrop />
            {children}
          </BaseDialog.Portal>
        )}
      </AnimatePresence>
    </BaseDialog.Root>
  );
}
