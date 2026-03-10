'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { motion } from 'motion/react';
import React, { type ReactNode } from 'react';
import {
  surfaceSpacingXVariants,
  type SurfaceVariants,
} from '~/components/layout/Surface';
import Modal from '~/components/Modal/Modal';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import CloseButton from '~/components/ui/CloseButton';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { compose, cva, cx } from '~/utils/cva';
import DialogPopup from './DialogPopup';

/**
 * Dialog section padding — composes surfaceSpacingXVariants for horizontal
 * padding with section-specific vertical padding, so the ScrollArea
 * scrollbar sits at the container edge.
 */
const dialogSectionVariants = compose(
  surfaceSpacingXVariants,
  cva({
    variants: {
      section: {
        header: 'pt-6 @xl:pt-8 @4xl:pt-8',
        content: 'py-2',
        footer: 'pb-6 @xl:pb-8 @4xl:pb-8',
      },
    },
  }),
);

// TODO: These seem like they belong in a shared location.
export const STATE_VARIANTS = [
  'default',
  'destructive',
  'success',
  'info',
] as const;

export type DialogProps = {
  title?: string;
  description?: ReactNode;
  accent?: (typeof STATE_VARIANTS)[number];
  closeDialog?: () => void;
  footer?: React.ReactNode;
  open?: boolean;
  children?: ReactNode;
  className?: string;
  layoutId?: string;
} & SurfaceVariants;

/**
 * Dialog component using Base UI Dialog primitives with motion animations.
 *
 * For use with `useDialog` and `DialogProvider`. Use `Dialog` in
 * situations where you need to control the dialog's open state manually.
 *
 * Implementation Notes:
 *
 * - Uses Base UI Dialog for accessibility and state management
 * - ModalPopup with ModalPopupAnimation for consistent animations
 * - Surface styling applied via className for proper elevation and spacing
 * - Backdrop click-to-close is handled by Base UI's dismissible behavior
 */
export default function Dialog({
  title,
  description,
  children,
  closeDialog,
  accent,
  footer,
  open = false,
  className,
  ...rest
}: DialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && closeDialog) {
          closeDialog();
        }
      }}
    >
      <DialogPopup
        key="dialog-popup"
        className={cx(
          // Accent overrides the primary hue so that nested primary buttons inherit color
          accent === 'success' && '[--color-primary:var(--color-success)]',
          accent === 'info' && '[--color-primary:var(--color-info)]',
          accent === 'destructive' &&
            '[--color-primary-contrast:var(--color-destructive-contrast)] [--color-primary:var(--color-destructive)]',
          className,
        )}
        {...rest}
      >
        <DialogHeader>
          <BaseDialog.Title render={<Heading margin="none" />}>
            {title}
          </BaseDialog.Title>
          <BaseDialog.Close nativeButton render={<CloseButton />} />
        </DialogHeader>
        <DialogContent>
          {description && (
            <BaseDialog.Description render={<Paragraph margin="none" />}>
              {description}
            </BaseDialog.Description>
          )}
          {children}
        </DialogContent>
        <DialogFooter>{footer}</DialogFooter>
      </DialogPopup>
    </Modal>
  );
}

Dialog.displayName = 'Dialog';

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      layout="position"
      className={cx(
        'flex items-center justify-between gap-2',
        dialogSectionVariants({ section: 'header' }),
      )}
    >
      {children}
    </motion.div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <ScrollArea
      viewportClassName={dialogSectionVariants({ section: 'content' })}
    >
      {children}
    </ScrollArea>
  );
};

const DialogFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.footer
      layout="position"
      className={cx(
        children && 'tablet:flex-row flex-col',
        children && 'mt-6 flex items-center justify-end gap-4',
        dialogSectionVariants({ section: 'footer' }),
        className,
      )}
    >
      {children}
    </motion.footer>
  );
};

export { DialogFooter };
