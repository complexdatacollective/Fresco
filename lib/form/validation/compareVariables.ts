import { type Variable } from '@codaco/protocol-validation';
import { isNil, isString } from 'es-toolkit';
import { isNumber } from 'es-toolkit/compat';
import { type FieldValue } from '../types';

export default function compareVariables(
  value1: unknown,
  value2: FieldValue,
  type: Variable['type'],
) {
  // check for null values
  if (isNil(value1) && isNil(value2)) {
    return 0;
  }

  if (isNil(value1)) {
    return -1;
  }

  if (isNil(value2)) {
    return 1;
  }

  // Check for objects
  if (value1 instanceof Object && value2 instanceof Object) {
    return JSON.stringify(value1).localeCompare(JSON.stringify(value2));
  }

  // check for booleans
  if (value1 === true && value2 === false) {
    return 1;
  }

  if (value1 === false && value2 === true) {
    return -1;
  }

  // check for dates
  if (type === 'datetime') {
    const date1 = new Date(value1 as string);
    const date2 = new Date(value2 as string);
    return date1.valueOf() - date2.valueOf();
  }

  // check for numbers (could be number, ordinal, scalar, etc)
  if (isNumber(value1) && isNumber(value2)) {
    return value1 - value2;
  }

  // string compare
  if (isString(value1) && isString(value2)) {
    return value1.localeCompare(value2);
  }

  return 0;
}
