import { isEqual, isNil, isNull } from 'es-toolkit';

export const operators = {
  EXACTLY: 'EXACTLY',
  INCLUDES: 'INCLUDES',
  EXCLUDES: 'EXCLUDES',
  EXISTS: 'EXISTS',
  NOT_EXISTS: 'NOT_EXISTS',
  NOT: 'NOT',
  CONTAINS: 'CONTAINS',
  DOES_NOT_CONTAIN: 'DOES_NOT_CONTAIN',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN: 'LESS_THAN',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  OPTIONS_GREATER_THAN: 'OPTIONS_GREATER_THAN',
  OPTIONS_LESS_THAN: 'OPTIONS_LESS_THAN',
  OPTIONS_EQUALS: 'OPTIONS_EQUALS',
  OPTIONS_NOT_EQUALS: 'OPTIONS_NOT_EQUALS',
} as const;

export const countOperators = {
  COUNT: 'COUNT',
  COUNT_NOT: 'COUNT_NOT',
  COUNT_ANY: 'COUNT_ANY',
  COUNT_NONE: 'COUNT_NONE',
  COUNT_GREATER_THAN: 'COUNT_GREATER_THAN',
  COUNT_GREATER_THAN_OR_EQUAL: 'COUNT_GREATER_THAN_OR_EQUAL',
  COUNT_LESS_THAN: 'COUNT_LESS_THAN',
  COUNT_LESS_THAN_OR_EQUAL: 'COUNT_LESS_THAN_OR_EQUAL',
} as const;

// Predicate values are intentionally broad: attribute values can be any
// VariableValue (string, number, boolean, arrays, records, null) and filter
// rule comparison values overlap but aren't identical. Using unknown here
// means each switch branch handles its own runtime narrowing, which matches
// the existing JS behavior.
type PredicateInput = {
  value: unknown;
  other: unknown;
};

// Bridges scalar/array storage of categorical attribute values for EXACTLY/NOT
// rules. Categorical attributes assigned via CategoricalBin are stored as
// scalars; via CheckboxGroup as arrays. A length-1 array is treated as
// equivalent to its single element so author-facing "is exactly X" rules in
// Architect work consistently regardless of which interface assigned the value.
const categoricalEqual = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && !Array.isArray(b)) {
    return a.length === 1 && a[0] === b;
  }
  if (!Array.isArray(a) && Array.isArray(b)) {
    return b.length === 1 && b[0] === a;
  }
  return isEqual(a, b);
};

// Treat scalar attribute values as a one-element sequence so OPTIONS_* counts
// work for categorical variables assigned via the CategoricalBin interface
// (which writes scalars). Array attributes (CheckboxGroup-assigned) keep their
// existing length semantics. Null / undefined count as zero.
const optionsLength = (value: unknown): number => {
  if (Array.isArray(value)) return value.length;
  if (value === null || value === undefined) return 0;
  return 1;
};

/**
 * returns functions that can be used to compare `value` with `other`
 *
 * @param operator One of the operators from the operators list.
 *
 * Usage:
 *
 * ```
 * predicate('GREATER_THAN')({ value: 2, other: 1 }); // returns true
 * ```
 */
const predicate =
  (operator: string) =>
  ({ value, other: variableValue }: PredicateInput): boolean => {
    switch (operator) {
      case operators.GREATER_THAN:
      case countOperators.COUNT_GREATER_THAN:
        return (value as number) > (variableValue as number);
      case operators.LESS_THAN:
      case countOperators.COUNT_LESS_THAN:
        return (value as number) < (variableValue as number);
      case operators.GREATER_THAN_OR_EQUAL:
      case countOperators.COUNT_GREATER_THAN_OR_EQUAL:
        return (value as number) >= (variableValue as number);
      case operators.LESS_THAN_OR_EQUAL:
      case countOperators.COUNT_LESS_THAN_OR_EQUAL:
        return (value as number) <= (variableValue as number);
      case operators.EXACTLY:
        return categoricalEqual(value, variableValue);
      case countOperators.COUNT:
        return isEqual(value, variableValue);
      case operators.NOT:
        return !categoricalEqual(value, variableValue);
      case countOperators.COUNT_NOT:
        return !isEqual(value, variableValue);
      case operators.CONTAINS: {
        const regexp = new RegExp(variableValue as string);
        return regexp.test(value as string);
      }
      case operators.DOES_NOT_CONTAIN: {
        const regexp = new RegExp(variableValue as string);
        return !regexp.test(value as string);
      }
      /**
       * WARNING: INCLUDES/EXCLUDES are complicated!
       *
       * value can be a string, an integer, or an array
       * variableValue can be a string, an integer, or an array
       *
       * If you change these, make sure you test all the cases!
       */
      case operators.INCLUDES: {
        // isNil, not `!value`: stored `0` / `false` are valid option values
        // and must reach the equality checks below.
        if (isNil(value)) {
          return false;
        }

        if (Array.isArray(variableValue)) {
          if (Array.isArray(value)) {
            return variableValue.every((v: unknown) => value.includes(v));
          }

          return variableValue.includes(value);
        }

        if (Array.isArray(value)) {
          return value.includes(variableValue);
        }

        // both are strings or integers
        return value === variableValue;
      }
      case operators.EXCLUDES: {
        // See INCLUDES for why this is isNil, not `!value`.
        if (isNil(value)) {
          return true;
        }

        if (Array.isArray(variableValue)) {
          if (Array.isArray(value)) {
            return variableValue.every((v: unknown) => !value.includes(v));
          }

          return !variableValue.includes(value);
        }

        if (Array.isArray(value)) {
          return !value.includes(variableValue);
        }

        // both are strings or integers
        return value !== variableValue;
      }
      case operators.EXISTS:
        return !isNull(value);
      case operators.NOT_EXISTS:
        return isNull(value);
      case countOperators.COUNT_ANY:
        return (value as number) > 0;
      case countOperators.COUNT_NONE:
        return value === 0;
      case operators.OPTIONS_GREATER_THAN: {
        return optionsLength(value) > (variableValue as number);
      }
      case operators.OPTIONS_LESS_THAN: {
        return optionsLength(value) < (variableValue as number);
      }
      case operators.OPTIONS_EQUALS: {
        return optionsLength(value) === variableValue;
      }
      case operators.OPTIONS_NOT_EQUALS: {
        return optionsLength(value) !== variableValue;
      }
      default:
        return false;
    }
  };

export default predicate;
