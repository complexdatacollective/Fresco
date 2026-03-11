'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import React, { type ReactNode } from 'react';
import {
  surfaceSpacingVariants,
  type SurfaceVariants,
} from '~/components/layout/Surface';
import Modal from '~/components/Modal/Modal';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import CloseButton from '~/components/ui/CloseButton';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx } from '~/utils/cva';
import DialogPopup from './DialogPopup';

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
  /** When true, prevents dialog from being dismissed by clicking outside or pressing Escape */
  preventDismiss?: boolean;
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
  preventDismiss = false,
  ...rest
}: DialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && closeDialog && !preventDismiss) {
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
          <BaseDialog.Title render={<Heading level="h2" margin="none" />}>
            {title}
          </BaseDialog.Title>
          {!preventDismiss && <BaseDialog.Close render={<CloseButton />} />}
        </DialogHeader>
        <DialogContent>
          {description && (
            <BaseDialog.Description render={<Paragraph />}>
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
    <div
      className={cx(
        'mb-4 flex items-center justify-between gap-2',
        surfaceSpacingVariants({ section: 'header' }),
      )}
    >
      {children}
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <ScrollArea
      viewportClassName={surfaceSpacingVariants({
        section: 'content',
        className: 'my-2!',
      })}
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
    <footer
      className={cx(
        'phone-landscape:flex-row phone-landscape:justify-between mt-4 flex flex-col gap-2',
        children && 'mt-6',
        surfaceSpacingVariants({ section: 'footer' }),
        className,
      )}
    >
      {children}
    </footer>
  );
};

export { DialogFooter };
