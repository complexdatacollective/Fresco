import { type FieldValue } from '../../store/types';

/**
 * Compares two FieldValue types to determine if they match.
 * Handles various types including primitives, arrays, objects, coordinates, and null/undefined.
 *
 * @param submittedValue - The value being submitted or compared
 * @param existingValue - The value to compare against
 * @returns true if the values match, false otherwise
 */
export default function isMatchingValue(
  submittedValue: unknown,
  existingValue: FieldValue | null,
): boolean {
  // If both values are strictly equal, they match
  if (submittedValue === existingValue) {
    return true;
  }

  // Handle null and undefined cases
  if (
    submittedValue === null ||
    submittedValue === undefined ||
    existingValue === null ||
    existingValue === undefined
  ) {
    return submittedValue === existingValue;
  }

  // Handle arrays
  if (Array.isArray(submittedValue) && Array.isArray(existingValue)) {
    // Different length arrays don't match
    if (submittedValue.length !== existingValue.length) {
      return false;
    }

    // Check if every element matches
    return submittedValue.every((val, index) => {
      return isMatchingValue(val, existingValue[index]);
    });
  }

  // Handle coordinate objects {x, y}
  if (
    typeof submittedValue === 'object' &&
    typeof existingValue === 'object' &&
    'x' in submittedValue &&
    'y' in submittedValue &&
    'x' in existingValue &&
    'y' in existingValue
  ) {
    return (
      submittedValue.x === existingValue.x &&
      submittedValue.y === existingValue.y
    );
  }

  // Handle record objects
  if (
    typeof submittedValue === 'object' &&
    typeof existingValue === 'object' &&
    !Array.isArray(submittedValue) &&
    !Array.isArray(existingValue)
  ) {
    const submittedKeys = Object.keys(submittedValue);
    const existingKeys = Object.keys(existingValue);

    // Different number of keys means they don't match
    if (submittedKeys.length !== existingKeys.length) {
      return false;
    }

    // Check if all keys exist in both objects and have matching values
    return submittedKeys.every((key) => {
      return (
        key in existingValue &&
        isMatchingValue(
          (submittedValue as Record<string, FieldValue>)[key],
          (existingValue as Record<string, FieldValue>)[key],
        )
      );
    });
  }

  // For primitives and other cases, use strict equality
  return submittedValue === existingValue;
}
