'use client';

import { LayoutGroup } from 'motion/react';
import { type ReactNode } from 'react';
import z from 'zod';
import UnorderedList from '~/components/typography/UnorderedList';
import { useField } from '../hooks/useField';
import {
  type ValidationFunction,
  type ValidationParameter,
  validations,
} from '../validation';
import { BaseField } from './BaseField';
import {
  type CustomFieldValidation,
  type FieldValue,
  type ValidationContext,
} from './types';

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

export type ValidationProps = {
  required: boolean;
  minLength: number;
  maxLength: number;
  pattern: { regex: string; hint: string; errorMessage: string };
  minValue: number;
  maxValue: number;
  minSelected: number;
  maxSelected: number;
  unique: string;
  differentFrom: string;
  sameAs: string;
  greaterThanVariable: string;
  lessThanVariable: string;
  /**
   * Custom validation with schema and hint.
   * Can be a single validation or an array of validations.
   * Schema can be a Zod schema directly, or a function that receives
   * form values and validation context and returns a schema.
   */
  custom: CustomFieldValidation | CustomFieldValidation[];
};

const validationPropKeys: (keyof ValidationProps)[] = [
  'required',
  'minLength',
  'maxLength',
  'pattern',
  'minValue',
  'maxValue',
  'minSelected',
  'maxSelected',
  'unique',
  'differentFrom',
  'sameAs',
  'greaterThanVariable',
  'lessThanVariable',
  'custom',
];

function filterValidationProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!validationPropKeys.includes(key as keyof ValidationProps)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldOwnProps<C extends React.ComponentType<any>> = {
  name: string;
  label: string;
  hint?: ReactNode;
  initialValue?: ExtractValue<C>;
  showValidationHints?: boolean;
  /**
   * Context required for context-dependent validations like unique, sameAs, etc.
   */
  validationContext?: ValidationContext;
  component: C;
} & Partial<ValidationProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldProps<C extends React.ComponentType<any>> = FieldOwnProps<C> &
  Omit<ExtractProps<C>, keyof FieldComponentProps | keyof ValidationProps>;

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
  ...componentProps
}: FieldProps<C>) {
  const { id, containerProps, fieldProps, meta, validationSummary } = useField({
    name,
    initialValue,
    showValidationHints,
    validationContext,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(filterValidationProps(componentProps) as any)}
          {...fieldProps}
        />
      </BaseField>
    </LayoutGroup>
  );
}

/**
 * Helper function that parses component props and converts them into a validation
 * using functions from ~/lib/form/validation/index.ts.
 *
 * Exported for use by UnconnectedField.
 */
export function makeValidationFunction(props: Record<string, unknown>) {
  const validationContext = props.validationContext as
    | ValidationContext
    | undefined;

  return (formValues: Record<string, FieldValue>) =>
    z.unknown().superRefine(async (fieldValue, ctx) => {
      // Handle built-in validations from the validations object
      const validationEntries = Object.entries(props).filter(
        ([key]) => key in validations && key !== 'validationContext',
      );

      for (const [validationName, parameter] of validationEntries) {
        try {
          const validationFnFactory = validations[
            validationName as keyof typeof validations
          ] as ValidationFunction<ValidationParameter>;

          const validationFn = validationFnFactory(
            parameter as ValidationParameter,
            validationContext,
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
          // eslint-disable-next-line no-console
          console.log('validation error', error);
          ctx.addIssue({
            code: 'custom',
            message: 'An error occurred while validating.',
          });
        }
      }

      // Handle custom validations (single or array)
      if ('custom' in props && props.custom) {
        const customValidations = Array.isArray(props.custom)
          ? (props.custom as CustomFieldValidation[])
          : [props.custom as CustomFieldValidation];

        for (const { schema } of customValidations) {
          try {
            // Resolve schema if it's a function
            const resolvedSchema =
              typeof schema === 'function'
                ? await schema(formValues, validationContext)
                : schema;

            const result = await resolvedSchema.safeParseAsync(fieldValue);

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
            // eslint-disable-next-line no-console
            console.log('custom validation error', error);
            ctx.addIssue({
              code: 'custom',
              message: 'An error occurred while validating.',
            });
          }
        }
      }
    });
}

/**
 * Helper function that generates a human readable summary of the validation rules
 * applied to a field by extracting hint metadata from each validation schema.
 *
 * Exported for use by UnconnectedField.
 */
export function makeValidationHints(props: Record<string, unknown>) {
  const validationContext = props.validationContext as
    | ValidationContext
    | undefined;

  const validationEntries = Object.entries(props).filter(
    ([key]) => key in validations && key !== 'validationContext',
  );

  const hints: string[] = [];

  for (const [validationName, parameter] of validationEntries) {
    // Skip required=false or other falsy values that indicate no validation
    if (validationName === 'required' && parameter !== true) {
      continue;
    }

    try {
      const validationFnFactory = validations[
        validationName as keyof typeof validations
      ] as ValidationFunction<
        string | number | boolean | { regex: string; hint: string }
      >;

      // Call the factory with the parameter to get the validation function
      // Pass empty object as formValues since we just need metadata
      const validationFn = validationFnFactory(
        parameter as
          | string
          | number
          | boolean
          | { regex: string; hint: string },
        validationContext,
      )({});

      // Extract hint from the schema's metadata
      const meta = validationFn.meta() as { hint?: string } | undefined;
      if (meta?.hint) {
        hints.push(meta.hint);
      }
    } catch {
      // If we can't get the hint (e.g., missing context for some validations),
      // skip this validation's hint
      // eslint-disable-next-line no-console
      console.warn(`Could not extract hint for validation: ${validationName}`);
    }
  }

  // Handle custom validation hints
  if ('custom' in props && props.custom) {
    const customValidations = Array.isArray(props.custom)
      ? (props.custom as CustomFieldValidation[])
      : [props.custom as CustomFieldValidation];

    for (const { hint } of customValidations) {
      hints.push(hint);
    }
  }

  if (hints.length === 0) {
    return null;
  }

  return (
    <UnorderedList className="mb-4!">
      {hints.map((hint, index) => (
        <li key={index}>{hint}</li>
      ))}
    </UnorderedList>
  );
}
