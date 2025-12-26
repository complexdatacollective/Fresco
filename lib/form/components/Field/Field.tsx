'use client';

import { LayoutGroup } from 'motion/react';
import { type ReactNode } from 'react';
import { useField, type UseFieldResult } from '~/lib/form/hooks/useField';
import { type FieldValue, type ValidationContext } from '~/lib/form/types';
import {
  filterValidationProps,
  type ValidationPropsCatalogue,
} from '../../validation/helpers';
import { BaseField } from './BaseField';

/**
 * Props that Field provides to components.
 * Excludes value, onChange, onBlur as these are defined by each component
 * with their specific types. Field provides these via fieldProps spread.
 */
export type InjectedFieldProps = UseFieldResult['fieldProps'] & {
  disabled?: boolean;
  readOnly?: boolean;
};

// Utility to pick a subset of validation props (all optional)
type ValidationProps<K extends keyof ValidationPropsCatalogue> = Partial<
  Pick<ValidationPropsCatalogue, K>
>;

// ═══════════════════════════════════════════════════════════════
// Combined utility for child component prop definitions
// ═══════════════════════════════════════════════════════════════
export type CreateFormFieldProps<
  TElement extends keyof React.JSX.IntrinsicElements,
  TValidationKeys extends keyof ValidationPropsCatalogue = never,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TCustom = {},
> = Omit<
  React.JSX.IntrinsicElements[TElement],
  keyof InjectedFieldProps | TValidationKeys | keyof TCustom
> &
  InjectedFieldProps &
  ValidationProps<TValidationKeys> &
  TCustom;

/**
 * Props for the Field component itself.
 */
export type FieldOwnProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  initialValue?: FieldValue;
  showValidationHints?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps &
  // Everything the child accepts, minus what Field provides
  Omit<React.ComponentProps<C>, keyof InjectedFieldProps>;

/**
 * Field component that connects to form context via useField hook.
 * Provides automatic state management, validation, and error display.
 *
 * For fields outside of form context, use UnconnectedField instead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Field<C extends React.ComponentType<any>>({
  name,
  label,
  hint,
  initialValue,
  showValidationHints = false,
  validationContext,
  component: Component,
  disabled,
  readOnly,
  ...componentProps
}: FieldProps<C> & { component: C }) {
  const { id, containerProps, fieldProps, meta, validationSummary } = useField({
    name,
    initialValue,
    showValidationHints,
    validationContext,
    disabled,
    readOnly,
    ...componentProps,
  });

  return (
    <LayoutGroup id={id}>
      <BaseField
        id={id}
        label={label}
        hint={hint}
        validationSummary={validationSummary}
        required={Boolean(componentProps.required)}
        errors={meta.errors}
        showErrors={meta.shouldShowError}
        containerProps={containerProps}
      >
        <Component
          id={id}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(filterValidationProps(componentProps) as any)}
          {...fieldProps}
        />
      </BaseField>
    </LayoutGroup>
  );
}
