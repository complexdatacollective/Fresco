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
  accent?: 'default' | 'danger' | 'success' | 'warning' | 'info';
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={cx(
                      'absolute inset-0 min-h-dvh',
                      'flex items-center justify-center',
                      'bg-overlay backdrop-blur-xs',
                      '[--bg-scope:var(--color-platinum-dark)]',
                    )}
                  />
                }
              >
                <BaseDialog.Popup
                  ref={ref}
                  render={
                    <motion.div
                      initial={{ opacity: 0, y: -48 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -48 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        duration: 0.3,
                      }}
                      className={cx(
                        '@container w-full md:w-auto',
                        'flex items-center justify-center',
                        'max-w-2xl overflow-hidden md:max-h-10/12',
                        // Accent overrides the primary hue so that nested primary buttons inherit color
                        accent === 'success' &&
                          '[--color-primary:var(--color-success)]',
                        accent === 'warning' &&
                          '[--color-primary:var(--color-warning)]',
                        accent === 'info' &&
                          '[--color-primary:var(--color-info)]',
                        accent === 'danger' &&
                          '[--color-primary:var(--color-destructive)]',
                      )}
                    >
                      <Surface
                        level={0}
                        className={cx(
                          'relative',
                          'flex flex-col',
                          'h-auto max-h-full max-w-full',
                          'ring-primary/75 overflow-hidden',
                        )}
                      >
                        <BaseDialog.Title
                          render={(titleProps) => (
                            <DialogHeading
                              {...titleProps}
                              id={`${id}-title`}
                              className={cx(titleProps.className, 'me-8')}
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
                        <BaseDialog.Close
                          render={(closeProps) => {
                            const typedProps = closeProps as Record<
                              string,
                              unknown
                            >;
                            return (
                              <CloseButton
                                type={typedProps.type as 'button' | undefined}
                                tabIndex={
                                  typedProps.tabIndex as number | undefined
                                }
                                disabled={
                                  typedProps.disabled as boolean | undefined
                                }
                                aria-label={
                                  typedProps['aria-label'] as string | undefined
                                }
                                data-state={
                                  typedProps['data-state'] as string | undefined
                                }
                                onClick={closeDialog}
                                data-dialog-close
                              />
                            );
                          }}
                        />
                      </Surface>
                    </motion.div>
                  }
                />
              </BaseDialog.Backdrop>
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
    <div className={cx('-mx-8 overflow-y-auto px-8', className)} {...props}>
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
