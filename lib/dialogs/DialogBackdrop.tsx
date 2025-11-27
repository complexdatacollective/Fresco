import { Dialog } from '@base-ui-components/react/dialog';
import { cx } from 'cva';
import { motion } from 'motion/react';

export function DialogBackdrop(props: Dialog.Backdrop.Props) {
  return (
    <Dialog.Backdrop
      render={
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            transition: { delay: 0.1, duration: 0.5 },
          }}
          exit={{ opacity: 0 }}
          className={cx(
            'fixed inset-0',
            'flex items-center justify-center',
            'bg-overlay backdrop-blur-xs',
            '[--published-bg:var(--color-platinum-dark)]',
          )}
        />
      }
      {...props}
    />
  );
}
