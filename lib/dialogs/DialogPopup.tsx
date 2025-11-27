import { Dialog } from '@base-ui-components/react/dialog';
import { motion } from 'motion/react';
import { type ComponentProps, type ReactNode } from 'react';
import { cx } from '~/utils/cva';

type DialogPopupProps = ComponentProps<typeof motion.div> & {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export default function DialogPopup({
  header,
  children,
  footer,
  className,
  ...props
}: DialogPopupProps) {
  return (
    <Dialog.Popup
      className={cx(
        'w-3xl',
        'fixed top-1/2 left-1/2 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg',
        'bg-surface-1 text-surface-1-foreground flex max-h-[80vh] flex-col',
        'shadow-xl',
        className,
      )}
      render={
        <motion.div
          initial={{ opacity: 0, y: '-10%', scale: 1.1 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
          }}
          exit={{
            opacity: 0,
            y: '-10%',
            scale: 1.5,
            filter: 'blur(10px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{ zIndex: 1000 }}
          {...props}
        >
          {header && (
            <div className="bg-accent text-accent-foreground sticky top-0 px-4 py-6">
              {header}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-6">{children}</div>
          {footer && (
            <div className="bg-accent text-accent-foreground sticky bottom-0 flex justify-end gap-2.5 px-4 py-6">
              {footer}
            </div>
          )}
        </motion.div>
      }
    />
  );
}
