'use client';

import { type ValidationName } from '@codaco/protocol-validation';
import { LayoutGroup } from 'motion/react';
import z from 'zod';
import { useField } from '../hooks/useField';
import { type ValidationFunction, validations } from '../validation';
import { BaseField } from './BaseField';
import { type FieldValidation, type FieldValue } from './types';

/**
 * Props that Field provides to components.
 * These are excluded from FieldProps since they're always provided by Field.
 */
type FieldComponentProps = {
  'id': string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'value'?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'onChange': (value: any) => void;
  'onBlur': (e: React.FocusEvent) => void;
  'aria-required': boolean;
  'aria-invalid': boolean;
  'aria-describedby': string;
};

/**
 * Extract the value type from a component's props.
 * Works with both function components and generic components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractProps<C> = C extends (props: infer P) => any
  ? P
  : C extends React.ComponentType<infer P>
    ? P
    : never;

type ExtractValue<C> =
  ExtractProps<C> extends { value?: infer V }
    ? NonNullable<V>
    : ExtractProps<C> extends { value: infer V }
      ? V
      : never;

type ValidationProps = {
  required: boolean;
  minLength: number;
  maxLength: number;
  pattern: string;
  minValue: number;
  maxValue: number;
  minSelected: number;
  maxSelected: number;
  unique: boolean;
  differentFrom: string;
  sameAs: string;
  greaterThanVariable: string;
  lessThanVariable: string;
  custom: FieldValidation;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldOwnProps<C extends React.ComponentType<any>> = {
  name: string;
  label: string;
  hint?: string;
  initialValue?: ExtractValue<C>;
  component: C;
} & Partial<ValidationProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps<C> &
  Omit<ExtractProps<C>, keyof FieldComponentProps>;

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
  component: Component,
  ...componentProps
}: FieldProps<C>) {
  const validationFn = makeValidationFunction(componentProps);

  const { id, containerProps, fieldProps, meta } = useField({
    name,
    initialValue: initialValue as FieldValue | undefined,
    required: Boolean(componentProps.required),
    validation: validationFn,
  });

  return (
    <LayoutGroup id={id}>
      <BaseField
        id={id}
        label={label}
        hint={hint}
        required={Boolean(componentProps.required)}
        errors={meta.errors}
        showErrors={meta.shouldShowError}
        containerProps={containerProps}
      >
        <Component
          id={id}
          name={name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(componentProps as any)}
          {...fieldProps}
        />
      </BaseField>
    </LayoutGroup>
  );
}

/**
 * Helper hook that parses component props and converts them into a validation
 * using functions from ~/lib/form/validation/index.ts
 */
export function makeValidationFunction(props: Record<string, unknown>) {
  return (formValues: Record<string, FieldValue>) =>
    z.unknown().superRefine(async (fieldValue, ctx) => {
      const validationEntries = Object.entries(props)
        // Filter to only named ValidationProps
        .filter(([key]) => key in validations);

      for (const [validationName, parameter] of validationEntries) {
        try {
          const validationFnFactory = validations[
            validationName as ValidationName
          ] as ValidationFunction<string | number | boolean>;

          const validationFn = validationFnFactory(
            parameter as string | number | boolean,
          )(formValues);

          const result = await validationFn.safeParseAsync(fieldValue);

          if (!result.success && result.error) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                code: 'custom',
                message: issue.message,
                path: [...issue.path],
              });
            });
          }
        } catch (error) {
          console.log('validation error', error);
          ctx.addIssue({
            code: 'custom',
            message: 'An error occurred while validating.',
          });
        }
      }
    });
}

/**
 * Helper function that generates a human readable summary of the validation rules
 * applied to a field that can be displayed to the user.
 */
export function makeValidationSummary(props: Record<string, unknown>) {
  const validationEntries = Object.entries(props)
    // Filter to only named ValidationProps
    .filter(([key]) => key in validations);

  const tips = [];

  for (const [validationName, parameter] of validationEntries) {
    switch (validationName) {
      case 'required':
        if (parameter === true) {
          tips.push('This field is required');
        }
        break;
      case 'minLength':
        tips.push(`Minimum length: ${parameter}`);
        break;
      case 'maxLength':
        tips.push(`Maximum length: ${parameter}`);
        break;
      case 'pattern':
        tips.push(`Must match pattern: ${parameter}`);
        break;
      case 'minValue':
        tips.push(`Minimum value: ${parameter}`);
        break;
      case 'maxValue':
        tips.push(`Maximum value: ${parameter}`);
        break;
      case 'minSelected':
        tips.push(`Select at least ${parameter} options`);
        break;
      case 'maxSelected':
        tips.push(`Select no more than ${parameter} options`);
        break;
      case 'unique':
        if (parameter === true) {
          tips.push('Value must be unique');
        }
        break;
    }
    return tips;
  }
}
