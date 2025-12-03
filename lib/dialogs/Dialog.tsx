'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { Slot } from '@radix-ui/react-slot';
import React, { type ComponentProps, forwardRef, type ReactNode } from 'react';
import CloseButton from '~/components/CloseButton';
import { type SurfaceVariants } from '~/components/layout/Surface';
import Modal from '~/components/Modal/Modal';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { cx, type VariantProps } from '~/utils/cva';
import DialogPopup, { DialogPopupAnimation } from './DialogPopup';

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
        <DialogPopup
          key="dialog"
          ref={ref}
          className={cx(
            // Accent overrides the primary hue so that nested primary buttons inherit color
            accent === 'success' && '[--color-primary:var(--color-success)]',
            accent === 'info' && '[--color-primary:var(--color-info)]',
            accent === 'destructive' &&
              '[--color-primary-contrast:var(--color-destructive-contrast)] [--color-primary:var(--color-destructive)]',
            className,
          )}
          {...DialogPopupAnimation}
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
  },
);

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
  ...props
}: ComponentProps<typeof ScrollArea.Root>) => {
  return (
    <ScrollArea.Root
      className="relative flex min-h-0 flex-1 overflow-hidden"
      {...props}
    >
      <ScrollArea.Viewport className="focusable min-h-0 flex-1 overflow-y-auto overscroll-contain py-6 pr-6 pl-1">
        <ScrollArea.Content className="flex flex-col gap-6">
          {children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="tablet:w-[0.325rem] pointer-events-none absolute m-1 flex w-[0.25rem] justify-center rounded-[1rem] opacity-0 transition-opacity duration-250 data-hovering:pointer-events-auto data-hovering:opacity-100 data-hovering:duration-75 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-75">
        <ScrollArea.Thumb className="w-full rounded-[inherit] bg-current before:absolute before:top-1/2 before:left-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
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
