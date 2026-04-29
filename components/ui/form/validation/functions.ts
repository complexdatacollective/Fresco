import { type Variable } from '@codaco/protocol-validation';
import { invariant } from 'es-toolkit';
import { z } from 'zod/mini';
import { type FieldValue, type ValidationContext } from '../store/types';
import collectNetworkValues from './utils/collectNetworkValues';
import compareVariables from './utils/compareVariables';
import { getVariableDefinition } from './utils/getVariableDefinition';
import isMatchingValue from './utils/isMatchingValue';

export type ValidationParameter =
  | string
  | number
  | boolean
  | Record<string, unknown>;

export type ValidationFunction<T extends ValidationParameter> = (
  // Parameter type is the value of the key/value pair of the protocol
  // validation object. required = boolean, maxLength = number,
  // unique = string etc.
  parameter: T,
  context?: ValidationContext,
) => (formValues: Record<string, FieldValue>) => z.ZodMiniType;

/**
 * Make a field required
 *
 * This works differently depending on the type of variable it is applied to:
 *
 * - text: not null, no strings with only spaces
 * - number: not null, but zero is permitted
 * - scalar: not null, zero is permitted
 * - datetime: not null, empty string is not permitted
 * - boolean: not null
 * - categorical: not null, empty array is not permitted
 */
export const required = (parameter?: boolean | string) => () => {
  const message =
    typeof parameter === 'string'
      ? parameter
      : 'You must answer this question before continuing.';

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      const isEmptyString =
        typeof value === 'string' && value.trim().length === 0;

      if (value === null || value === undefined || isEmptyString) {
        ctx.addIssue({
          code: 'custom',
          input: value,
          message: message,
          path: [],
        });
      }

      // Handle number fields
      if (typeof value === 'number') {
        if (isNaN(value)) {
          ctx.addIssue({
            code: 'custom',
            input: value,
            message: message,
            path: [],
          });
        }
      }

      // Handle array fields
      if (Array.isArray(value)) {
        if (value.length === 0) {
          ctx.addIssue({
            code: 'custom',
            input: value,
            message: message,
            path: [],
          });
        }
      }
    }),
  ); // No hint for required because we use the asterisk in the UI
};

/**
 * Require that a string be shorter than a maximum length
 */
const maxLength: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max length must be specified');

  const hint = `Enter at most ${max} characters.`;

  return z
    .prefault(
      z
        .string()
        .check(
          z.maxLength(
            max,
            `Too long. Enter fewer than than ${max} characters.`,
          ),
        ),
      '',
    )
    .check(z.meta({ hint }));
};

/**
 * Require that a string be longer than a minimum length
 */
const minLength: ValidationFunction<number> = (min) => () => {
  invariant(min, 'Min length must be specified');

  const hint = `Enter at least ${min} characters.`;

  return z
    .prefault(
      z
        .string()
        .check(
          z.minLength(min, `Too short. Enter at least ${min} characters.`),
        ),
      '',
    )
    .check(z.meta({ hint }));
};

/**
 * Require that a number be greater than or equal to a minimum value
 * Uses coerce to handle string inputs from HTML number inputs
 */
const minValue: ValidationFunction<number> = (min) => () => {
  invariant(!isNaN(Number(min)), 'Min value must be specified');

  const hint = `Enter a value greater than or equal to ${min}.`;

  return z
    .prefault(
      z.coerce
        .number()
        .check(z.gte(min, `Too small. Value must be at least ${min}.`)),
      min - 1,
    )
    .check(z.meta({ hint }));
};

/**
 * Require that a number be less than or equal to a maximum value
 * Uses coerce to handle string inputs from HTML number inputs
 */
const maxValue: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max value must be specified');

  const hint = `Enter a value less than or equal to ${max}.`;

  return z
    .prefault(
      z.coerce
        .number()
        .check(z.lte(max, `Too large. Value must be at most ${max}.`)),
      max - 1,
    )
    .check(z.meta({ hint }));
};

/**
 * Detects strings shaped like the ISO/HTML date-time literals accepted by
 * `<input type="date|month|week|time|datetime-local">`. A bare year like
 * "2000" is ambiguous with a number, so it's NOT treated as date-shaped
 * here — the caller checks the opposing side (param or value) for a
 * separator before committing to string-comparison mode.
 */
function matchesDatePattern(s: string): boolean {
  if (s === '') return false;
  // YYYY-MM, YYYY-MM-DD, YYYY-MM-DDTHH:MM(:SS)?
  if (/^\d{4}-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?)?)?$/.test(s)) {
    return true;
  }
  // HH:MM(:SS)? — <input type="time">
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) return true;
  // YYYY-W## — <input type="week">
  if (/^\d{4}-W\d{2}$/.test(s)) return true;
  return false;
}

/**
 * Compare two ISO-style date/time strings that may be at different
 * resolutions (e.g. "2020", "2020-06", "2020-06-15"). Truncates both to the
 * shorter length before comparison so that a year value overlapping a
 * YYYY-MM-DD bound is considered in-range — matching DatePicker's UI, which
 * exposes partially-overlapping years/months.
 */
function compareDateStrings(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  const truncA = a.substring(0, len);
  const truncB = b.substring(0, len);
  if (truncA < truncB) return -1;
  if (truncA > truncB) return 1;
  return 0;
}

const YEAR_RE = /^(\d{4})$/;
const YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;
const DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;
const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Format a min/max bound for human-readable display in validation hints.
 * Uses the runtime's locale via Intl.DateTimeFormat with timeZone: 'UTC' so
 * the formatted date matches the literal YYYY-MM-DD bound regardless of the
 * viewer's timezone. Returns the raw string for values we don't recognise
 * as date/time literals.
 */
function formatBoundForDisplay(bound: string): string {
  if (YEAR_RE.test(bound)) return bound;

  const yearMonth = YEAR_MONTH_RE.exec(bound);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  const dateTime = DATE_TIME_RE.exec(bound);
  if (dateTime) {
    const year = Number(dateTime[1]);
    const month = Number(dateTime[2]);
    const day = Number(dateTime[3]);
    const hour = dateTime[4];
    if (hour !== undefined) {
      const date = new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          Number(hour),
          Number(dateTime[5]),
          dateTime[6] !== undefined ? Number(dateTime[6]) : 0,
        ),
      );
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(date);
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  const time = TIME_RE.exec(bound);
  if (time) {
    const anchor = new Date(Date.UTC(1970, 0, 1));
    anchor.setUTCHours(
      Number(time[1]),
      Number(time[2]),
      time[3] !== undefined ? Number(time[3]) : 0,
      0,
    );
    return new Intl.DateTimeFormat(undefined, {
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(anchor);
  }

  return bound;
}

/**
 * HTML-aligned minimum bound. Handles inputs whose `min` attribute is a
 * date/time ISO string (date, month, week, time, datetime-local) or a number
 * (number, range). Dispatches based on parameter type.
 */
const min: ValidationFunction<number | string> = (minParam) => () => {
  invariant(
    minParam !== undefined && minParam !== null && minParam !== '',
    'Min must be specified',
  );

  const paramIsDateShaped =
    typeof minParam === 'string' && matchesDatePattern(minParam);
  const displayMin = paramIsDateShaped
    ? formatBoundForDisplay(minParam)
    : String(minParam);
  const hint = paramIsDateShaped
    ? `Must be on or after ${displayMin}.`
    : `Enter a value greater than or equal to ${displayMin}.`;

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      const valueIsDateShaped =
        typeof value === 'string' && matchesDatePattern(value);

      if (paramIsDateShaped || valueIsDateShaped) {
        if (typeof value !== 'string' || typeof minParam !== 'string') return;
        if (compareDateStrings(value, minParam) < 0) {
          ctx.addIssue({
            code: 'custom',
            input: value,
            message: `Must be on or after ${displayMin}.`,
            path: [],
          });
        }
        return;
      }

      const numValue = Number(value);
      const numMin = Number(minParam);
      if (isNaN(numValue) || isNaN(numMin)) return;
      if (numValue < numMin) {
        ctx.addIssue({
          code: 'custom',
          input: value,
          message: `Too small. Value must be at least ${displayMin}.`,
          path: [],
        });
      }
    }),
    z.meta({ hint }),
  );
};

/**
 * HTML-aligned maximum bound. See `min` for dispatch rules.
 */
const max: ValidationFunction<number | string> = (maxParam) => () => {
  invariant(
    maxParam !== undefined && maxParam !== null && maxParam !== '',
    'Max must be specified',
  );

  const paramIsDateShaped =
    typeof maxParam === 'string' && matchesDatePattern(maxParam);
  const displayMax = paramIsDateShaped
    ? formatBoundForDisplay(maxParam)
    : String(maxParam);
  const hint = paramIsDateShaped
    ? `Must be on or before ${displayMax}.`
    : `Enter a value less than or equal to ${displayMax}.`;

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      const valueIsDateShaped =
        typeof value === 'string' && matchesDatePattern(value);

      if (paramIsDateShaped || valueIsDateShaped) {
        if (typeof value !== 'string' || typeof maxParam !== 'string') return;
        if (compareDateStrings(value, maxParam) > 0) {
          ctx.addIssue({
            code: 'custom',
            input: value,
            message: `Must be on or before ${displayMax}.`,
            path: [],
          });
        }
        return;
      }

      const numValue = Number(value);
      const numMax = Number(maxParam);
      if (isNaN(numValue) || isNaN(numMax)) return;
      if (numValue > numMax) {
        ctx.addIssue({
          code: 'custom',
          input: value,
          message: `Too large. Value must be at most ${displayMax}.`,
          path: [],
        });
      }
    }),
    z.meta({ hint }),
  );
};

/**
 * Require that an array have a minimum number of elements
 */
const minSelected: ValidationFunction<number> = (min) => () => {
  invariant(typeof min === 'number', 'Min items must be specified');

  const hint = `Select at least ${min} value${min === 1 ? '' : 's'}.`;

  return z
    .prefault(
      z
        .array(z.unknown())
        .check(
          z.minLength(
            min,
            `Too few selected. Select at least ${min} value${min === 1 ? '' : 's'}.`,
          ),
        ),
      [],
    )
    .check(z.meta({ hint }));
};

/**
 * Require that an array have a maximum number of elements
 */
const maxSelected: ValidationFunction<number> = (max) => () => {
  invariant(typeof max === 'number', 'Max items must be specified');

  const hint = `Select a maximum of ${max} value${max === 1 ? '' : 's'}.`;

  return z
    .prefault(
      z
        .array(z.unknown())
        .check(
          z.maxLength(
            max,
            `Too many items selected. Select a maximum of ${max} value${max === 1 ? '' : 's'}.`,
          ),
        ),
      Array.from({ length: max }, () => null),
    )
    .check(z.meta({ hint }));
};

/**
 * Require that a value is unique among all entities of the same type in the
 * current network
 */
const unique: ValidationFunction<string> = (attribute, context) => () => {
  invariant(
    context,
    'Validation context must be provided when using unique validation',
  );
  const { stageSubject, network, currentEntityId } = context;

  const hint = 'Must be unique.';

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      invariant(
        stageSubject.entity !== 'ego',
        'Not applicable to ego entities',
      );
      invariant(
        typeof attribute === 'string',
        'Attribute must be specified for unique validation',
      );

      // Collect other values of the same type, excluding the entity
      // currently being edited (if any) so its own value isn't treated
      // as a duplicate.
      const existingValues = collectNetworkValues(
        network,
        stageSubject,
        attribute,
        currentEntityId,
      );

      if (existingValues.some((v) => isMatchingValue(value, v))) {
        ctx.addIssue({
          code: 'custom',
          message: 'This value is used elsewhere. It must be unique.',
          path: [],
        });
      }
    }),
    z.meta({ hint }),
  );
};

/**
 * Require that a value is different from another variable in the same form
 *
 * Note: although we are comparing with the *current form only*, we can
 * optionally get the comparison variable name from the codebook when context
 * is provided. When context is not available, the attribute string is used
 * as the display name.
 */
const differentFrom: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for differentFrom validation',
    );

    // Resolve the display name - use codebook name if context available, otherwise use attribute
    let displayName = attribute;
    if (context) {
      const { stageSubject, codebook } = context;
      const comparisonVariable = getVariableDefinition(
        codebook,
        stageSubject,
        attribute,
      );
      invariant(
        comparisonVariable,
        'Comparison variable not found in codebook',
      );
      displayName = comparisonVariable.name;
    }

    return z.unknown().check(
      z.superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }
        if (isMatchingValue(value, formValues[attribute])) {
          ctx.addIssue({
            code: 'custom',
            message: `Your answer must be different from '${displayName}'.`,
            path: [],
          });
        }
      }),
      z.meta({ hint: `Must be different from '${displayName}'.` }),
    );
  };

/**
 * Require that a value be the same as another variable in the same form
 *
 * See note about comparison variables in the `differentFrom` validation.
 */
const sameAs: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for sameAs validation',
    );

    // Resolve the display name - use codebook name if context available, otherwise use attribute
    let displayName = attribute;
    if (context) {
      const { stageSubject, codebook } = context;
      const comparisonVariable = getVariableDefinition(
        codebook,
        stageSubject,
        attribute,
      );
      invariant(
        comparisonVariable,
        'Comparison variable not found in codebook',
      );
      displayName = comparisonVariable.name;
    }

    return z.unknown().check(
      z.superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }
        if (!isMatchingValue(value, formValues[attribute])) {
          ctx.addIssue({
            code: 'custom',
            message: `Your answer must be the same as '${displayName}'.`,
            path: [],
          });
        }
      }),
      z.meta({ hint: `Must match the value of '${displayName}'.` }),
    );
  };

/**
 * Require that a value be greater than another variable in the same form
 */
const greaterThanVariable: ValidationFunction<{
  attribute: string;
  type: Variable['type'];
}> = (parameter, context) => (formValues) => {
  const { attribute, type } = parameter;

  invariant(
    typeof attribute === 'string',
    'Attribute must be specified for greaterThanVariable validation',
  );

  invariant(
    typeof type === 'string',
    'Type must be specified for greaterThanVariable validation',
  );

  // Resolve the display name - use codebook name if context available, otherwise use attribute
  let displayName = attribute;
  if (context) {
    const { stageSubject, codebook } = context;
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );
    invariant(comparisonVariable, 'Comparison variable not found in codebook');
    displayName = comparisonVariable.name;
  }

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      // Only validate if the comparison attribute exists in formValues
      if (!(attribute in formValues)) {
        return;
      }
      // Strict comparison: value must be greater than (not equal to) the comparison
      if (compareVariables(value, formValues[attribute], type) <= 0) {
        ctx.addIssue({
          code: 'too_small',
          minimum: Number(formValues[attribute]),
          inclusive: false,
          origin: type === 'datetime' ? 'date' : 'number',
          message: `Your answer must be greater than the value of '${displayName}'.`,
          path: [],
        });
      }
    }),
    z.meta({
      hint: `Must be greater than the value of '${displayName}'.`,
    }),
  );
};

/**
 * Require that a value matches a pattern. Designed to mirror the 'pattern'
 * attribute of HTML5 input elements.
 */
const pattern: ValidationFunction<{
  regex: string;
  errorMessage: string;
  hint: string;
}> =
  ({ regex, errorMessage, hint }) =>
  () => {
    invariant(regex, 'Regex must be specified');
    invariant(hint, 'Hint must be specified for pattern validation');

    return z
      .prefault(z.string().check(z.regex(new RegExp(regex), errorMessage)), '')
      .check(z.meta({ hint }));
  };

/**
 * Require that a value be less than another variable in the same form
 */
const lessThanVariable: ValidationFunction<{
  attribute: string;
  type: Variable['type'];
}> = (parameter, context) => (formValues) => {
  const { attribute, type } = parameter;

  invariant(
    typeof attribute === 'string',
    'Attribute must be specified for lessThanVariable validation',
  );

  invariant(
    typeof type === 'string',
    'Type must be specified for lessThanVariable validation',
  );

  // Resolve the display name - use codebook name if context available, otherwise use attribute
  let displayName = attribute;
  if (context) {
    const { stageSubject, codebook } = context;
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );
    invariant(comparisonVariable, 'Comparison variable not found in codebook');
    displayName = comparisonVariable.name;
  }

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      // Only validate if the comparison attribute exists in formValues
      if (!(attribute in formValues)) {
        return;
      }

      // Strict comparison: value must be less than (not equal to) the comparison
      if (compareVariables(value, formValues[attribute], type) >= 0) {
        ctx.addIssue({
          code: 'too_big',
          maximum: Number(formValues[attribute]),
          inclusive: false,
          origin: type === 'datetime' ? 'date' : 'number',
          message: `Your answer must be less than the value of '${displayName}'.`,
          path: [],
        });
      }
    }),
    z.meta({
      hint: `Must be less than the value of '${displayName}'.`,
    }),
  );
};

/**
 * Require that a value be greater than or equal to another variable in the same form
 */
const greaterThanOrEqualToVariable: ValidationFunction<{
  attribute: string;
  type: Variable['type'];
}> = (parameter, context) => (formValues) => {
  const { attribute, type } = parameter;

  invariant(
    typeof attribute === 'string',
    'Attribute must be specified for greaterThanOrEqualToVariable validation',
  );

  invariant(
    typeof type === 'string',
    'Type must be specified for greaterThanOrEqualToVariable validation',
  );

  // Resolve the display name - use codebook name if context available, otherwise use attribute
  let displayName = attribute;
  if (context) {
    const { stageSubject, codebook } = context;
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );
    invariant(comparisonVariable, 'Comparison variable not found in codebook');
    displayName = comparisonVariable.name;
  }

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      // Only validate if the comparison attribute exists in formValues
      if (!(attribute in formValues)) {
        return;
      }
      if (compareVariables(value, formValues[attribute], type) < 0) {
        ctx.addIssue({
          code: 'too_small',
          minimum: Number(formValues[attribute]),
          inclusive: true,
          origin: type === 'datetime' ? 'date' : 'number',
          message: `Your answer must be greater than or equal to the value of '${displayName}'.`,
          path: [],
        });
      }
    }),
    z.meta({
      hint: `Must be greater than or equal to the value of '${displayName}'.`,
    }),
  );
};

/**
 * Require that a value be less than or equal to another variable in the same form
 */
const lessThanOrEqualToVariable: ValidationFunction<{
  attribute: string;
  type: Variable['type'];
}> = (parameter, context) => (formValues) => {
  const { attribute, type } = parameter;

  invariant(
    typeof attribute === 'string',
    'Attribute must be specified for lessThanOrEqualToVariable validation',
  );

  invariant(
    typeof type === 'string',
    'Type must be specified for lessThanOrEqualToVariable validation',
  );

  // Resolve the display name - use codebook name if context available, otherwise use attribute
  let displayName = attribute;
  if (context) {
    const { stageSubject, codebook } = context;
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );
    invariant(comparisonVariable, 'Comparison variable not found in codebook');
    displayName = comparisonVariable.name;
  }

  return z.unknown().check(
    z.superRefine((value, ctx) => {
      // Only validate if the comparison attribute exists in formValues
      if (!(attribute in formValues)) {
        return;
      }

      if (compareVariables(value, formValues[attribute], type) > 0) {
        ctx.addIssue({
          code: 'too_big',
          maximum: Number(formValues[attribute]),
          inclusive: true,
          origin: type === 'datetime' ? 'date' : 'number',
          message: `Your answer must be less than or equal to the value of '${displayName}'.`,
          path: [],
        });
      }
    }),
    z.meta({
      hint: `Must be less than or equal to the value of '${displayName}'.`,
    }),
  );
};

const email = () => () => {
  const hint = 'Must be a valid email address.';

  return z
    .prefault(z.email('Enter a valid email address.'), '')
    .check(z.meta({ hint }));
};

const custom = () => () => void 0; // Placeholder for custom validation handled elsewhere

export const validations = {
  email,
  required,
  minLength,
  maxLength,
  pattern,
  min,
  max,
  minValue,
  maxValue,
  minSelected,
  maxSelected,
  unique,
  differentFrom,
  sameAs,
  greaterThanVariable,
  lessThanVariable,
  greaterThanOrEqualToVariable,
  lessThanOrEqualToVariable,
  custom,
};

export const validationPropKeys = Object.keys(
  validations,
) as (keyof typeof validations)[];

export type ValidationPropKey = (typeof validationPropKeys)[number];
