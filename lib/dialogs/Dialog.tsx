'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Slot } from '@radix-ui/react-slot';
import { type motion } from 'motion/react';
import React, { forwardRef, type ReactNode } from 'react';
import CloseButton from '~/components/CloseButton';
import { type SurfaceVariants } from '~/components/layout/Surface';
import Modal from '~/components/Modal/Modal';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx, type VariantProps } from '~/utils/cva';
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
export function Dialog({
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
        key="dialog"
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
        <BaseDialog.Title
          render={(props) => (
            <DialogHeading
              className="flex items-center justify-between gap-2"
              {...props}
            >
              {title} <BaseDialog.Close render={<CloseButton />} />
            </DialogHeading>
          )}
        />
        <DialogContent>
          {description && (
            <BaseDialog.Description
              render={(descProps) => (
                <DialogDescription
                  {...descProps}
                  className={descProps.className}
                >
                  {description}
                </DialogDescription>
              )}
            />
          )}
          {children}
        </DialogContent>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogPopup>
    </Modal>
  );
}

Dialog.displayName = 'Dialog';

type DialogHeadingProps = {
  asChild?: boolean;
  as?: string;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const DialogHeading = forwardRef<HTMLElement, DialogHeadingProps>(
  ({ className, variant, level, margin, as, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : (as ?? level ?? 'h2');
    return (
      <Comp
        className={cx(headingVariants({ variant, level, margin, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

DialogHeading.displayName = 'DialogHeading';

type DialogDescriptionProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof paragraphVariants>;

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, intent, emphasis, margin, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'p';
  return (
    <Comp
      className={cx(paragraphVariants({ intent, emphasis, margin, className }))}
      ref={ref}
      {...props}
    />
  );
});

DialogDescription.displayName = 'DialogDescription';

const DialogContent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return <ScrollArea>{children}</ScrollArea>;
};

const DialogFooter = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  return (
    <footer
      className={cx(
        'tablet:flex-row flex-col',
        'mt-4 flex justify-end gap-4',
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
};

DialogFooter.displayName = 'DialogFooter';

export { DialogContent, DialogDescription, DialogFooter, DialogHeading };
