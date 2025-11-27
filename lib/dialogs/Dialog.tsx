'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { Slot } from '@radix-ui/react-slot';
import React, { forwardRef, type ReactNode } from 'react';
import CloseButton from '~/components/CloseButton';
import {
  surfaceVariants,
  type SurfaceVariants,
} from '~/components/layout/Surface';
import Modal from '~/components/Modal';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { cx, type VariantProps } from '~/utils/cva';
import ModalPopup, { ModalPopupAnimation } from './ModalPopup';

export type DialogProps = {
  title?: string;
  description?: ReactNode;
  accent?: 'default' | 'destructive' | 'success' | 'info';
  closeDialog?: () => void;
  footer?: React.ReactNode;
  open?: boolean;
  children?: ReactNode;
  className?: string;
} & SurfaceVariants;

/**
 * Dialog component using Base UI Dialog primitives with motion animations.
 *
 * For use with `useDialog` and `DialogProvider`. Use `ControlledDialog` in
 * situations where you need to control the dialog's open state manually.
 *
 * Implementation Notes:
 *
 * - Uses Base UI Dialog for accessibility and state management
 * - ModalPopup with ModalPopupAnimation for consistent animations
 * - Surface styling applied via className for proper elevation and spacing
 * - Backdrop click-to-close is handled by Base UI's dismissible behavior
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      title,
      description,
      children,
      closeDialog,
      accent,
      footer,
      open = false,
      level = 0,
      spacing = 'md',
      elevation = 'high',
      bleed,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <Modal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen && closeDialog) {
            closeDialog();
          }
        }}
      >
        <ModalPopup
          key="dialog"
          ref={ref}
          className={cx(
            surfaceVariants({ level, spacing, elevation, bleed }),
            'w-[calc(100%-var(--spacing)*4)] max-w-2xl @2xl:w-auto @2xl:min-w-xl',
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex max-h-[calc(100vh-var(--spacing)*4)]',
            // Accent overrides the primary hue so that nested primary buttons inherit color
            accent === 'success' && '[--color-primary:var(--color-success)]',
            accent === 'info' && '[--color-primary:var(--color-info)]',
            accent === 'destructive' &&
              '[--color-primary-contrast:var(--color-destructive-contrast)] [--color-primary:var(--color-destructive)]',
            'flex flex-col',
            className,
          )}
          {...ModalPopupAnimation}
          {...rest}
        >
          <BaseDialog.Title
            render={(props) => (
              <div className="mb-4 flex items-center justify-between gap-4">
                <DialogHeading {...props}>{title}</DialogHeading>
                <BaseDialog.Close render={<CloseButton />} />
              </div>
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
        </ModalPopup>
      </Modal>
    );
  },
);

Dialog.displayName = 'Dialog';

type DialogHeadingProps = {
  asChild?: boolean;
  as?: string;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const DialogHeading = forwardRef<HTMLElement, DialogHeadingProps>(
  (
    { className, variant, level, margin = 'none', as, asChild, ...props },
    ref,
  ) => {
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
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cx('-mx-8 overflow-y-auto px-8 pb-2', className)}
      {...props}
    >
      {children}
    </div>
  );
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
