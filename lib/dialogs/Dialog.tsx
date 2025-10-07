'use client';

import { Slot } from '@radix-ui/react-slot';
import React, { forwardRef, useId } from 'react';
import CloseButton from '~/components/CloseButton';
import Surface from '~/components/layout/Surface';
import { headingVariants } from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx, type VariantProps } from '~/utils/cva';

export type DialogProps = {
  title: string;
  description?: string;
  accent?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  closeDialog: () => void;
  footer?: React.ReactNode;
} & React.DialogHTMLAttributes<HTMLDialogElement>;

/**
 * Native HTML Dialog modified so that it can be used with React.
 *
 * For use with `useDialog` and `DialogProvider`. Use `ControlledDialog` in
 * situations where you need to control the dialog's open state manually.
 *
 * Implementation Notes:
 *
 * - The reason this component has an inner Surface component is that the native
 *   dialog uses margin for centering, so we cannot customise margin to ensure
 *   a visible  space from screen edge on small screens.
 * - `allow-discrete` is implemented in the tailwind config, and is required for
 *   the dialog to be able to be animated correctly. See: https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior#allow-discrete
 * - There's no way I can think of to use framer-motion for animation here, as
 *   the animation state is linked to the `open` attribute of the dialog, which
 *   can't be read from the dialog itself (although _can_ be read by mutation
 *   observer... but that's a bit much)
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  (
    { title, description, children, closeDialog, accent, footer, ...rest },
    ref,
  ) => {
    const id = useId();
    // TODO: automatic focus on least destructive action, or initialFocusEl ref.
    return (
      <dialog
        ref={ref}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        onClose={closeDialog} // Needed so that closing via keyboard still returns a value
        onClick={(e) => {
          // Close dialog when clicking on backdrop (the dialog element itself, not children)
          if (e.target === e.currentTarget) {
            closeDialog();
          }
        }}
        className={cx(
          'spring-discrete-medium',
          'rounded-lg bg-transparent', // Or else rounded corner content will have white edges
          'backdrop:bg-navy-taupe/70 backdrop:backdrop-blur-xs not-open:backdrop:opacity-0 open:backdrop:delay-100 backdrop:starting:opacity-0',
          'backdrop:transition-opacity',
          'backdrop:duration-300',
          'backdrop:transition-discrete',
          'm-auto not-open:-translate-y-12 not-open:opacity-0 starting:-translate-y-12 starting:opacity-0',
          '[--bg-scope:oklch(50%_0_0)]',

          // Accent overrides the primary hue so that nested buttons inherit color
          accent === 'success' && '[--color-primary:var(--color-success)]',
          accent === 'warning' && '[--color-primary:var(--color-warning)]',
          accent === 'info' && '[--color-primary:var(--color-info)]',
          accent === 'danger' && '[--color-primary:var(--color-destructive)]',
        )}
        {...rest}
      >
        <Surface
          level={0}
          className={cx(
            'w-full md:w-auto',
            'max-w-2xl',
            'max-h-10/12',
            'border-b-primary elevation-none overflow-hidden rounded-lg border-b-4',
          )}
        >
          <DialogHeading level="h2" id={`${id}-title`} className="me-8">
            {title}
          </DialogHeading>
          {description && (
            <Paragraph id={`${id}-description`} intent="lead" className="mb-4">
              {description}
            </Paragraph>
          )}
          {children}
          {footer && (
            <footer className="mt-4 flex justify-end gap-2">{footer}</footer>
          )}
          <CloseButton onClick={closeDialog} data-dialog-close />
        </Surface>
      </dialog>
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
