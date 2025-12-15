import { Dialog } from '@base-ui/react/dialog';
import { cx } from 'cva';
import { motion } from 'motion/react';

/**
 * A simple backdrop component for modals and dialogs using Base-UI's Dialog
 * system. Fades in and out using motion.
 */
export function ModalBackdrop(props: Dialog.Backdrop.Props) {
  return (
    <Dialog.Backdrop
      render={
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            transition: { delay: 0.2, duration: 0.5 },
          }}
          exit={{ opacity: 0 }}
          className={cx(
            'fixed inset-0',
            'flex items-center justify-center',
            'bg-overlay publish-colors backdrop-blur-xs',
          )}
        />
      }
      {...props}
    />
  );
}
