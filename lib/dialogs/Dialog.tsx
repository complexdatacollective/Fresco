import React, { useId } from 'react';
import CloseButton from '~/components/CloseButton';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cn } from '../utils';

export type DialogProps = {
  title: string;
  description?: string;
  ref?: React.RefObject<HTMLDialogElement>;
  accent?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  closeDialog: () => void;
} & React.DialogHTMLAttributes<HTMLDialogElement>;

/**
 * Native HTML Dialog modified so that it can be used with React.
 *
 * For use with `useDialog` and `DialogProvider`! Use `ControlledDialog` in
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
export const Dialog = ({
  title,
  description,
  children,
  ref,
  closeDialog,
  accent,
  ...rest
}: DialogProps) => {
  const id = useId();
  // TODO: automatic focus on least destructive action, or initialFocusEl ref.
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onClose={closeDialog} // Needed so that closing via keyboard still returns a value
      className={cn(
        'bg-transparent',
        'opacity-0 transition-all duration-300 ease-out allow-discrete motion-safe:-translate-y-6',
        'open:opacity-100 open:backdrop:bg-overlay/70 open:from:backdrop:bg-overlay/0 motion-safe:open:translate-y-0 motion-safe:open:from:-translate-y-6',
        'backdrop:bg-overlay/0 backdrop:backdrop-blur-xs backdrop:transition-all backdrop:delay-100 backdrop:duration-300 backdrop:ease-out open:backdrop:delay-0',
      )}
      {...rest}
    >
      <Surface
        level={0}
        className={cn(
          'max-w-4xl rounded bg-surface-0 text-surface-0-foreground',

          // Accent overrides the primary hue so that nested buttons inherit color
          accent === 'success' && '[--primary:var(--success)]',
          accent === 'warning' && '[--primary:var(--warning)]',
          accent === 'info' && '[--primary:var(--info)]',
          accent === 'danger' && '[--primary:var(--destructive)]',
          'border-b-4 border-primary',
        )}
      >
        <Heading variant="h2" id={`${id}-title`}>
          {title}
        </Heading>
        {description && (
          <Paragraph id={`${id}-description`}>{description}</Paragraph>
        )}
        {children}
        <CloseButton onClick={closeDialog} />
      </Surface>
    </dialog>
  );
};
