/**
 * Extract the value type from a component's props.
 * Works with both function components and generic components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractProps<C> = C extends (props: infer P) => any
  ? P
  : C extends React.ComponentType<infer P>
    ? P
    : never;

/**
 * All validation prop keys that should be excluded from native element props.
 * These are form system-specific props that shouldn't be spread onto HTML elements.
 */
export const VALIDATION_PROP_KEYS = [
  'required',
  'minLength',
  'maxLength',
  'minValue',
  'maxValue',
  'minSelected',
  'maxSelected',
  'pattern',
  'custom',
  'unique',
  'sameAs',
  'differentFrom',
  'greaterThanVariable',
  'lessThanVariable',
] as const;

type ValidationPropKey = (typeof VALIDATION_PROP_KEYS)[number];

/**
 * Extracts validation props from a props object and returns them separately
 * from the remaining props. Useful for preventing form system props from
 * being spread onto native HTML elements.
 */
export function extractValidationProps<T extends Record<string, unknown>>(
  props: T,
): {
  validationProps: Partial<Record<ValidationPropKey, unknown>>;
  rest: Omit<T, ValidationPropKey>;
} {
  const validationProps: Partial<Record<ValidationPropKey, unknown>> = {};
  const rest = { ...props };

  for (const key of VALIDATION_PROP_KEYS) {
    if (key in rest) {
      validationProps[key] = rest[key as keyof typeof rest];
      delete rest[key as keyof typeof rest];
    }
  }

  return { validationProps, rest: rest as Omit<T, ValidationPropKey> };
}
