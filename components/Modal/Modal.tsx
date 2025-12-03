import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';
import { ModalBackdrop } from './ModalBackdrop';

/**
 * A modal component designed to render full screen "overlay" UIs using
 * Base-UI's Dialog system. Handles open/close state and animation of
 * backdrop and content via motion's AnimatePresence.
 *
 * Use with ModalPopup or similar based on Dialog.Popup for the content.
 *
 * @see ModalPopup for a popup component to use within the Modal.
 * @see Dialog for an example of using this component to create a modal overlay.
 *
 * @param open Whether the modal is open.
 * @param onOpenChange Callback when the open state changes.
 * @param children The content of the modal.
 *
 *
 */
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
            <ModalBackdrop />
            {children}
          </BaseDialog.Portal>
        )}
      </AnimatePresence>
    </BaseDialog.Root>
  );
}
