'use client';

import { type ReactNode } from 'react';
import { cx } from '~/utils/cva';
import FieldErrors from '../FieldErrors';
import { FieldLabel } from '../FieldLabel';
import Hint from '../Hint';

// Exclude event handlers that conflict with Framer Motion
type ExcludeMotionConflicts<T> = Omit<
  T,
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDragStart'
  | 'onDrop'
>;

type BaseFieldProps = {
  id: string;
  name?: string;
  label: string;
  hint?: ReactNode;
  validationSummary?: ReactNode;
  required?: boolean;
  errors?: string[];
  showErrors?: boolean;
  inline?: boolean;
  children: ReactNode;
  // TODO: the data attributes should be typed based on the return value of useField.
  containerProps?: ExcludeMotionConflicts<
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>
  > &
    Record<`data-${string}`, string | boolean | undefined>;
};

/**
 * BaseField provides the shared markup/layout for form fields.
 * Used internally by Field (connected) and UnconnectedField (standalone).
 */
export function BaseField({
  id,
  name,
  label,
  hint,
  validationSummary,
  required,
  errors = [],
  showErrors = false,
  inline = false,
  children,
  containerProps,
}: BaseFieldProps) {
  return (
    <div
      {...containerProps}
      className={cx(
        'group desktop:not-last:mb-10 tablet-landscape:not-last:mb-8 w-full grow not-last:mb-6',
        'flex flex-col',
      )}
    >
      <div
        className={cx(
          inline &&
            'tablet-portrait:flex-row tablet-portrait:align-middle tablet-portrait:items-center tablet-portrait:justify-between tablet-portrait:gap-4',
          'flex flex-col',
        )}
      >
        <div className={cx(inline && 'min-w-0', !inline && 'mb-4')}>
          <FieldLabel id={`${id}-label`} htmlFor={id} required={required}>
            {label}
          </FieldLabel>
          {(hint ?? validationSummary) && (
            <Hint id={`${id}-hint`}>
              {hint}
              {validationSummary}
            </Hint>
          )}
        </div>
        <div className={cx(inline && 'shrink-0')}>{children}</div>
      </div>
      <FieldErrors
        id={`${id}-error`}
        name={name}
        errors={errors}
        show={showErrors}
      />
    </div>
  );
}
