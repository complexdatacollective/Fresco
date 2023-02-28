import type { Protocol, StageSubject } from "@codaco/shared-consts";
import { isObject } from "utils";

const getErrorString = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
};


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
 */
const makePattern = (pattern: string | RegExp) => {
  if (typeof pattern === 'string') {
    const re = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/\[\]/g, '.?\\[\\d+\\]');
    return new RegExp(`${re}$`);
  }
  return pattern;
};

type Keypath = Array<string>;

const keypathString = (keypath: Keypath) =>
  keypath.reduce((acc, path) => {
    if ((/\[\d+\]/).test(path)) {
      return `${acc}${path}`;
    }
    return `${acc}.${path}`;
  });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fragment = any;

type ValidateFunction = (fragment: Fragment, subject: StageSubject, keypath: Keypath) => boolean;

type SequenceSingle = [ValidateFunction, MakeFailureMessageFunction];

type Sequence = Array<SequenceSingle>;

type MakeFailureMessageFunction = (fragment: Fragment, subject: StageSubject, keypath: Keypath) => string;

type Pattern = RegExp;

type BaseValidation = {
  pattern: Pattern;
}

type SingleValidation = BaseValidation & {
  validate: ValidateFunction;
  makeFailureMessage: MakeFailureMessageFunction;
}

type SequenceValidation = BaseValidation & {
  sequence: Sequence;
}

type Validation = SingleValidation | SequenceValidation;

class Validator {
  errors: Map<string, string>;
  warnings: Map<string, string>;
  validations: Array<Validation>;
  protocol: Protocol;

  constructor(protocol: Protocol) {
    this.errors = new Map();
    this.warnings = new Map();
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
  addValidation(
    pattern: string,
    validate: ValidateFunction,
    makeFailureMessage: MakeFailureMessageFunction
  ) {
    this.validations.push({ pattern: makePattern(pattern), validate, makeFailureMessage });
  }

  /**
   * Provides a way to run dependent validations.
   * Validations will run in sequence until the first failure.
   *
   * To always run multiple validations on the same pattern, call addValidation multiple times.
   */
  addValidationSequence(
    pattern: string,
    ...sequence: Sequence
  ) {
    this.validations.push({ pattern: makePattern(pattern), sequence });
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
    keypath: Keypath,
    fragment: unknown,
    { validate, makeFailureMessage }: { validate: ValidateFunction, makeFailureMessage: MakeFailureMessageFunction },
    subject: StageSubject
  ) {
    let result;

    try {
      result = validate(fragment, subject, keypath);
    } catch (err: unknown) {
      const errorText = getErrorString(err);
      this.warnings.set(keypathString(keypath), errorText);
      return true;
    }
    if (!result) {
      let failureMessage;
      try {
        // Try to decorate the failure message with useful info
        failureMessage = makeFailureMessage(fragment, subject, keypath);
      } catch (err: unknown) {
        const shifted = keypath.shift() || 'Unknown';
        const errorMessage = getErrorString(err);
        this.warnings.set(shifted, `makeFailureMessage error: ${errorMessage}`);
        return true;
      }
      this.errors.set(keypathString(keypath), failureMessage);
      return false;
    }
    return true;
  }

  /**
   * Run a sequence validations in-order until a failure is hit
   * @private
   */
  validateSequence(keypath: Keypath, fragment: Fragment, sequence: Sequence, subject: StageSubject) {
    sequence.every(
      ([validate, makeFailureMessage]: [validate: ValidateFunction, makeFailureMessage: MakeFailureMessageFunction]) =>
        this.validateSingle(keypath, fragment, { validate, makeFailureMessage }, subject),
    );
  }

  /**
   * Run supplied validations if the validation's pattern matches the keypath
   * @private
   */
  checkFragment(keypath: Keypath, fragment: Fragment, subject: StageSubject) {
    this.validations.forEach((validation) => {
      const { pattern } = validation;

      // If the pattern doesn't match the keypath, skip this path.
      if (!pattern.test(keypathString(keypath))) {
        return;
      }

      // If we have a sequence, call validateSequence. If we have a single validation, call validateSingle
      if ('sequence' in validation) {
        this.validateSequence(keypath, fragment, validation.sequence, subject);
        return;
      }

      if ('validate' in validation) {
        this.validateSingle(keypath, fragment, validation, subject);
        return;
      }

      return;
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
  traverse(fragment: Fragment, keypath: Keypath = ['protocol'], subject?: StageSubject) {
    if (!fragment) {
      return;
    }

    const getSubject = (fragment: Fragment, subject?: StageSubject) => {
      if (subject) {
        return subject;
      }

      if (isObject(fragment) && 'subject' in fragment) {
        return fragment.subject;
      }
    }

    // Use the subject passed in if present, otherwise get it from fragment
    const stageSubject = getSubject(fragment, subject);

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
