'use client';

import { useId } from 'react';
import { type ExtractProps } from '~/lib/form/validation/utils/extractProps';
import { BaseField } from './BaseField';
import { type InjectedFieldProps } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnconnectedFieldProps<C extends React.ComponentType<any>> = {
  id?: string;
  label: string;
  hint?: string;
  required?: boolean;
  errors?: string[];
  showErrors?: boolean;
  component: C;
} & Omit<ExtractProps<C>, keyof InjectedFieldProps>;

/**
 * UnconnectedField renders a field with consistent styling but without
 * connecting to form context. Use this for standalone fields or when
 * managing state externally.
 *
 * For fields that should connect to form context, use Field instead.
 *
 * @example
 * ```tsx
 * <UnconnectedField
 *   label="Username"
 *   component={Input}
 *   value={username}
 *   onChange={setUsername}
 * />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UnconnectedField<C extends React.ComponentType<any>>({
  id: providedId,
  label,
  hint,
  required,
  errors,
  showErrors,
  component: Component,
  ...componentProps
}: UnconnectedFieldProps<C>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  const describedBy = [hint && `${id}-hint`, errors?.length && `${id}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <BaseField
      id={id}
      label={label}
      hint={hint}
      required={required}
      errors={errors}
      showErrors={showErrors}
    >
      <Component
        id={id}
        aria-required={required ?? false}
        aria-describedby={describedBy || undefined}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(componentProps as any)}
      />
    </BaseField>
  );
}
