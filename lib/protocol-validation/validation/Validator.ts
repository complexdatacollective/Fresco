import { type StageSubject } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { type ValidationError } from '..';
import { Protocol } from '../schemas/src/8.zod';

/**
 * See addValidation().
 *
 * For readability, a keypath pattern can be supplied as a string instead of a RegExp.
 * This converts string patterns to a corresponding RegExp. Patterns will match as specifically
 * as possible, so the RegExp always matches to the end.
 *
 * - keypath patterns are separated by dots, e.g. 'protocol.forms.myForm.fields'
 * - '*' is used to denote a wildcard key in the path
 * - '[]' is used to denote an array. If a trailing '[]' is included, the keypath matches on
 *        each array element, and the validate function returns each item in turn.
 *
 * Examples:
 * - 'protocol.forms.*' is equivalent to /forms\.[^.]+$/ and will match any stage subject
 * - 'protocol.stages[].subject' is equivalent to /stages\.\[\d+\]\.subject$/ and will match
 *   a subject on any stage.
 *
 * @private
 */
const ensurePatternRegExp = (pattern: string | RegExp): RegExp => {
  if (typeof pattern === 'string') {
    const re = pattern
      .replace(/\\/g, '\\\\')
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/\[\]/g, '.?\\[\\d+\\]');
    return new RegExp(`${re}$`);
  }
  return pattern;
};

type KeyPath = string[];

const keypathToString = (keypath: string | string[]): string => {
  if (typeof keypath === 'string') {
    return keypath;
  }

  return keypath.reduce((acc, path) => {
    if (/\[\d+\]/.test(path)) {
      return `${acc}${path}`;
    }
    return `${acc}.${path}`;
  });
};

type ValidationPattern = RegExp;

type ValidationFunction<T> = (
  fragment: T,
  subject: StageSubject | null,
  keypath: KeyPath,
) => boolean;

type ValidationMakeFailureMessage<T> = (
  fragment: T,
  subject: StageSubject | null,
  keypath: KeyPath,
) => string;

type ValidationSequence<T> = [
  ValidationFunction<T>,
  ValidationMakeFailureMessage<T>,
][];

type ValidationItemSingle<T> = {
  validate: ValidationFunction<T>;
  makeFailureMessage: ValidationMakeFailureMessage<T>;
};

type ValidationItemSequence<T> = {
  sequence: ValidationSequence<T>;
};

type ValidationItemBase = {
  pattern: ValidationPattern;
};

type Validation<T> = ValidationItemBase &
  (ValidationItemSingle<T> | ValidationItemSequence<T>);

type LogicError = Record<string, never>;

/**
 * @class
 * Support data validations on a protocol.
 *
 * When runValidations() is called on an instance, we walk the entire protocol,
 * keeping track of the keypath.
 *
 * When a keypath matches one (or more) of the supplied validation patterns,
 * the corresponding validation function is called.
 *
 * Validations are added with `addValidation()` or `addValidationSequence()`.
 */
class Validator {
  private protocol: Protocol;
  errors: ValidationError[];
  warnings: string[];
  private validations: Validation<any>[];

  constructor(protocol: Protocol) {
    this.errors = [];
    this.warnings = [];
    this.validations = [];
    this.protocol = protocol;
  }

  /**
   * @description Run the given validation for any protocol fragment matching the pattern
   * @param {string|RegExp} pattern
   * @param {Function} validate called to validate a fragment when pattern matches
   *                            `validate(fragment) => boolean`
   *                            Return true if validation passes; false if there was a failure.
   * @param {Function} makeFailureMessage called with the fragment when validation fails.
   *                                      `makeFailureMessage(fragment) => string`
   *                                      Return a user-facing error message.
   */
  addValidation<T>(
    pattern: string | RegExp,
    validate: ValidationFunction<T>,
    makeFailureMessage: ValidationMakeFailureMessage<T>,
  ) {
    this.validations.push({
      pattern: ensurePatternRegExp(pattern),
      validate,
      makeFailureMessage,
    });
  }

  /**
   * Provides a way to run dependent validations.
   * Validations will run in sequence until the first failure.
   *
   * To always run multiple validations on the same pattern, call addValidation multiple times.
   */
  addValidationSequence<T>(
    pattern: string | RegExp,
    ...sequence: ValidationSequence<T>
  ) {
    this.validations.push({ pattern: ensurePatternRegExp(pattern), sequence });
  }

  /**
   * Run the added validation on the given fragment identified by keypath
   * @private
   * @param  {Array} keypath
   * @param  {Any} fragment
   * @param  {Function} validation.validate
   * @param  {Function} validation.makeFailureMessage
   * @param  {Object} subject the entity & type (for stage fragments & descendants)
   * @return {boolean} result false if there was an error,
   *                          true if validation passed, or if validation couldn't be completed
   */
  validateSingle(
    keypath: KeyPath,
    fragment: unknown,
    {
      validate,
      makeFailureMessage,
    }: {
      validate: ValidationFunction<unknown>;
      makeFailureMessage: ValidationMakeFailureMessage<unknown>;
    },
    subject: StageSubject | null,
  ) {
    let result;
    try {
      result = validate(fragment, subject, keypath);
    } catch (err: unknown) {
      let errorString;
      if (err instanceof Error) {
        errorString = `Validation error for ${keypathToString(
          keypath,
        )}: ${err.toString()}`;
      } else {
        errorString = `Validation error for ${keypathToString(
          keypath,
        )}: ${err}`;
      }

      this.warnings.push(errorString);
      return true;
    }
    if (!result) {
      let failureMessage;
      try {
        // Try to decorate the failure message with useful info
        // const subjectTypeName = getSubjectTypeName(this.protocol.codebook, subject);
        // console.log('subjtn', subjectTypeName);
        failureMessage = makeFailureMessage(fragment, subject, keypath);
      } catch (err) {
        let errorString;
        if (err instanceof Error) {
          errorString = `makeFailureMessage error for ${keypathToString(
            keypath.shift() || [],
          )}: ${err.toString()}`;
        } else {
          errorString = `makeFailureMessage error for ${keypathToString(
            keypath.shift() || [],
          )}: ${err}`;
        }
        this.warnings.push(errorString);
        return true;
      }

      this.errors.push({
        path: keypathToString(keypath),
        message: failureMessage,
      });

      return false;
    }
    return true;
  }

  /**
   * Run a sequence validations in-order until a failure is hit
   * @private
   */
  validateSequence(
    keypath: KeyPath,
    fragment: unknown,
    sequence: ValidationSequence<unknown>,
    subject: StageSubject | null,
  ) {
    sequence.every(([validate, makeFailureMessage]) =>
      this.validateSingle(
        keypath,
        fragment,
        { validate, makeFailureMessage },
        subject,
      ),
    );
  }

  /**
   * Run supplied validations if the validation's pattern matches the keypath
   * @private
   */
  checkFragment(
    keypath: KeyPath,
    fragment: unknown,
    subject: StageSubject | null,
  ) {
    this.validations.forEach((validation) => {
      const { pattern } = validation;
      if (!pattern.test(keypathToString(keypath))) {
        return;
      }
      if ('sequence' in validation) {
        this.validateSequence(keypath, fragment, validation.sequence, subject);
      } else {
        this.validateSingle(
          keypath,
          fragment,
          {
            validate: validation.validate,
            makeFailureMessage: validation.makeFailureMessage,
          },
          subject,
        );
      }
    });
  }

  /**
   * Run all validations that have been added for this protocol.
   *
   * When done,
   * - `validator.errors` will contain all errors uncovered.
   * - `validator.warnings` will contain other warnings, including any errors with validation
   * itself (which should not prevent a protocol from validating).
   */
  runValidations() {
    this.traverse(this.protocol);
  }

  /**
   * Recursively traverse to validate parts of a protocol for which we have validations
   * @private
   */
  traverse(
    fragment: unknown,
    keypath = ['protocol'],
    subject: StageSubject | null = null,
  ) {
    if (!fragment) {
      return;
    }

    let stageSubject: StageSubject | null;

    if (subject) {
      stageSubject = subject;
    } else {
      stageSubject = get(fragment, 'subject', null);
    }

    this.checkFragment(keypath, fragment, stageSubject);

    if (Array.isArray(fragment)) {
      fragment.forEach((v, i) => {
        this.traverse(v, [...keypath, `[${i}]`], stageSubject);
      });
    } else if (fragment && typeof fragment === 'object') {
      Object.entries(fragment).forEach(([key, val]) => {
        this.traverse(val, [...keypath, key], stageSubject);
      });
    }
  }
}

export default Validator;
