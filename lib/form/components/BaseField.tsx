'use client';

import { type ReactNode } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

export type BaseFieldProps = {
  id: string;
  label: string;
  hint?: string;
  validationSummary?: ReactNode;
  required?: boolean;
  errors?: string[];
  showErrors?: boolean;
  children: ReactNode;
  // TODO: the data attributes should be typed based on the return value of useField.
  containerProps?: Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> &
    Record<`data-${string}`, string | boolean | undefined>;
};

/**
 * BaseField provides the shared markup/layout for form fields.
 * Used internally by Field (connected) and UnconnectedField (standalone).
 */
export function BaseField({
  id,
  label,
  hint,
  validationSummary,
  required,
  errors = [],
  showErrors = false,
  children,
  containerProps,
}: BaseFieldProps) {
  return (
    <div {...containerProps} className="group w-full grow not-last:mb-6">
      <FieldLabel id={`${id}-label`} htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {(hint ?? validationSummary) && (
        <Hint id={`${id}-hint`}>
          {hint && <Paragraph>{hint}</Paragraph>}
          {validationSummary}
        </Hint>
      )}
      {children}
      <FieldErrors id={`${id}-error`} errors={errors} show={showErrors} />
    </div>
  );
}
