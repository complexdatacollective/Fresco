'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { Slot } from '@radix-ui/react-slot';
import { AnimatePresence, motion } from 'motion/react';
import React, { forwardRef, type ReactNode, useId } from 'react';
import CloseButton from '~/components/CloseButton';
import Surface from '~/components/layout/Surface';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { cx, type VariantProps } from '~/utils/cva';

export type DialogProps = {
  title?: string;
  description?: ReactNode;
  accent?: 'default' | 'danger' | 'success' | 'info';
  closeDialog: () => void;
  footer?: React.ReactNode;
  open?: boolean;
  children?: ReactNode;
};

/**
 * Dialog component using Base UI Dialog primitives with motion animations.
 *
 * For use with `useDialog` and `DialogProvider`. Use `ControlledDialog` in
 * situations where you need to control the dialog's open state manually.
 *
 * Implementation Notes:
 *
 * - Uses Base UI Dialog for accessibility and state management
 * - AnimatePresence and motion for enter/exit animations
 * - The inner Surface component ensures proper spacing from screen edge on small screens
 * - Backdrop click-to-close is handled by Base UI's dismissible behavior
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    { title, description, children, closeDialog, accent, footer, open = false },
    ref,
  ) => {
    const id = useId();
    return (
      <BaseDialog.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeDialog();
          }
        }}
        modal={true}
      >
        <BaseDialog.Portal keepMounted>
          <AnimatePresence>
            {open && (
              <BaseDialog.Backdrop
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
                      '[--bg-scope:var(--color-platinum-dark)]',
                    )}
                  />
                }
              />
            )}
            {open && (
              <BaseDialog.Popup
                ref={ref}
                render={
                  <Surface
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
                    as={motion.div}
                    level={0}
                    className={cx(
                      'fixed top-1/2 left-1/2 -mt-8 -translate-x-1/2 -translate-y-1/2',
                      'flex max-h-dvh w-2xl',
                      // Accent overrides the primary hue so that nested primary buttons inherit color
                      accent === 'success' &&
                        '[--color-primary:var(--color-success)]',
                      accent === 'info' &&
                        '[--color-primary:var(--color-info)]',
                      accent === 'danger' &&
                        '[--color-primary:var(--color-destructive)]',
                      'flex flex-col',
                    )}
                    elevation="high"
                  >
                    <BaseDialog.Title
                      render={(titleProps) => (
                        <DialogHeading
                          {...titleProps}
                          id={`${id}-title`}
                          className={cx(titleProps.className)}
                        >
                          {title}
                        </DialogHeading>
                      )}
                    />
                    <DialogContent>
                      {description && (
                        <BaseDialog.Description
                          render={(descProps) => (
                            <DialogDescription
                              {...descProps}
                              id={`${id}-description`}
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
                    <BaseDialog.Close render={<CloseButton />} />
                  </Surface>
                }
              />
            )}
          </AnimatePresence>
        </BaseDialog.Portal>
      </BaseDialog.Root>
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
    <footer className={cx('mt-4 flex justify-end gap-2', className)} {...props}>
      {children}
    </footer>
  );
};

DialogFooter.displayName = 'DialogFooter';

export { DialogContent, DialogDescription, DialogFooter, DialogHeading };
