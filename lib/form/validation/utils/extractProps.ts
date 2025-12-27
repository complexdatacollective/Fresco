import { validationPropKeys, type ValidationPropKey } from '../functions';

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

  for (const key of validationPropKeys) {
    if (key in rest) {
      validationProps[key] = rest[key as keyof typeof rest];
      delete rest[key as keyof typeof rest];
    }
  }

  return { validationProps, rest: rest as Omit<T, ValidationPropKey> };
}
