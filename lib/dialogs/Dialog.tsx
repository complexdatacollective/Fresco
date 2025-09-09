'use client';

import React, { forwardRef, useId } from 'react';
import CloseButton from '~/components/CloseButton';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';

export type DialogProps = {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  accent?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  closeDialog: () => void;
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
        className={cx(
          'spring-medium',
          'bg-transparent', // Or else rounded corner content will have white edges
          'backdrop:bg-charcoal/70 backdrop:backdrop-blur-xs not-open:backdrop:opacity-0 open:backdrop:delay-100 backdrop:starting:opacity-0',
          'backdrop:transition-opacity',
          'backdrop:duration-300',
          'backdrop:transition-discrete',
          'm-auto transition-discrete not-open:-translate-y-12 not-open:opacity-0 starting:-translate-y-12 starting:opacity-0',
        )}
        {...rest}
      >
        <Surface
          level={0}
          className={cx(
            'text-surface-0-foreground max-w-4xl rounded bg-white',

            // Accent overrides the primary hue so that nested buttons inherit color
            accent === 'success' && '[--primary:var(--success)]',
            accent === 'warning' && '[--primary:var(--warning)]',
            accent === 'info' && '[--primary:var(--info)]',
            accent === 'danger' && '[--primary:var(--destructive)]',
            'border-primary border-b-4',
          )}
        >
          <Heading variant="h2" id={`${id}-title`}>
            {title}
          </Heading>
          {description && (
            <Paragraph id={`${id}-description`}>{description}</Paragraph>
          )}
          {children}
          {footer}
          <CloseButton onClick={closeDialog} />
        </Surface>
      </dialog>
    );
  },
);

Dialog.displayName = 'Dialog';
