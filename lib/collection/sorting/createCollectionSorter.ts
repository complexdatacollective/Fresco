/**
 * Creates a sort function for collection items.
 *
 * Adapted from lib/interviewer/utils/createSorter.ts for use in the
 * Collection component system.
 */

import { get } from 'es-toolkit/compat';
import { type SortDirection, type SortRule } from './types';

type Item = Record<string, unknown>;

/**
 * Creating a collator that is reused by string comparison is significantly faster
 * than using `localeCompare` directly.
 *
 * See: https://stackoverflow.com/a/52369951/1497330
 */
const collator = new Intl.Collator();

/**
 * Maps a `_createdIndex` index value to all items in an array.
 * Used for FIFO/LIFO sorting by original array position.
 */
const withCreatedIndex = <T extends Item>(items: T[]) =>
  items.map((item, _createdIndex) => ({ ...item, _createdIndex }));

/**
 * Removes the '_createdIndex' prop from items after sorting.
 */
const withoutCreatedIndex = <T extends Item>(
  items: (T & { _createdIndex?: number })[],
) => items.map(({ _createdIndex: _, ...originalItem }) => originalItem as T);

type PropertyGetter<T extends Item> = (item: T) => unknown;

/**
 * Helper that returns a function compatible with Array.sort that uses an
 * arbitrary `propertyGetter` function to fetch values for comparison.
 * Ascending order.
 */
const asc =
  <T extends Item>(propertyGetter: PropertyGetter<T>) =>
  (a: T, b: T) => {
    const firstValue = propertyGetter(a);
    const secondValue = propertyGetter(b);

    if (firstValue === null || firstValue === undefined) {
      return 1;
    }

    if (secondValue === null || secondValue === undefined) {
      return -1;
    }

    return (
      -Number(firstValue < secondValue) || +Number(firstValue > secondValue)
    );
  };

/**
 * Descending order - reverses the comparison.
 */
const desc =
  <T extends Item>(propertyGetter: PropertyGetter<T>) =>
  (a: T, b: T) =>
    asc(propertyGetter)(b, a);

type SortFn<T extends Item> = (a: T, b: T) => number;

/**
 * Helper function that executes a series of functions in order, passing until
 * one of them returns a non-zero value.
 *
 * Used to chain together multiple sort functions.
 */
const chain =
  <T extends Item>(...fns: SortFn<T>[]) =>
  (a: T, b: T) =>
    fns.reduce((diff, fn) => diff || fn(a, b), 0);

/**
 * Get the value from an item at the given property path.
 */
const getValue = <T extends Item>(
  item: T,
  property: string | string[],
): unknown => {
  return get(item, property, null);
};

/**
 * String comparison sort function.
 * Handles null/undefined values by placing them at the end.
 */
const stringFunction =
  <T extends Item>(
    property: string | string[],
    direction: SortDirection,
  ): SortFn<T> =>
  (a: T, b: T) => {
    const firstValue = getValue(a, property) as string | null;
    const secondValue = getValue(b, property) as string | null;

    if (firstValue === null || typeof firstValue !== 'string') {
      return 1;
    }

    if (secondValue === null || typeof secondValue !== 'string') {
      return -1;
    }

    if (direction === 'asc') {
      return collator.compare(firstValue, secondValue);
    }

    return collator.compare(secondValue, firstValue);
  };

/**
 * Number comparison sort function.
 */
const numberFunction =
  <T extends Item>(
    property: string | string[],
    direction: SortDirection,
  ): SortFn<T> =>
  (a: T, b: T) => {
    const firstValue = getValue(a, property);
    const secondValue = getValue(b, property);

    // Handle null/undefined/non-number values
    const firstNum =
      typeof firstValue === 'number' && !Number.isNaN(firstValue)
        ? firstValue
        : direction === 'asc'
          ? Infinity
          : -Infinity;
    const secondNum =
      typeof secondValue === 'number' && !Number.isNaN(secondValue)
        ? secondValue
        : direction === 'asc'
          ? Infinity
          : -Infinity;

    if (direction === 'asc') {
      return firstNum - secondNum;
    }
    return secondNum - firstNum;
  };

/**
 * Date comparison sort function.
 */
const dateFunction =
  <T extends Item>(
    property: string | string[],
    direction: SortDirection,
  ): SortFn<T> =>
  (a: T, b: T) => {
    const firstValueString = getValue(a, property) as string | null;
    const secondValueString = getValue(b, property) as string | null;

    const firstValueDate = Date.parse(firstValueString ?? '');
    const secondValueDate = Date.parse(secondValueString ?? '');

    if (Number.isNaN(firstValueDate)) {
      return 1;
    }

    if (Number.isNaN(secondValueDate)) {
      return -1;
    }

    if (direction === 'asc') {
      return (
        -Number(firstValueDate < secondValueDate) ||
        +Number(firstValueDate > secondValueDate)
      );
    }

    return (
      -Number(firstValueDate > secondValueDate) ||
      +Number(firstValueDate < secondValueDate)
    );
  };

/**
 * Boolean comparison sort function.
 * false < true in ascending order.
 */
const booleanFunction =
  <T extends Item>(
    property: string | string[],
    direction: SortDirection,
  ): SortFn<T> =>
  (a: T, b: T) => {
    const firstValue = getValue(a, property);
    const secondValue = getValue(b, property);

    // Convert to boolean, default false for null/undefined
    const firstBool = Boolean(firstValue);
    const secondBool = Boolean(secondValue);

    if (firstBool === secondBool) return 0;

    if (direction === 'asc') {
      return firstBool ? 1 : -1;
    }
    return firstBool ? -1 : 1;
  };

/**
 * Transforms a sort rule into a sort function compatible with Array.sort.
 */
const getSortFunction = <T extends Item>(
  rule: SortRule,
): SortFn<T & { _createdIndex?: number }> => {
  const { property, direction = 'asc', type } = rule;

  // LIFO/FIFO rule sorted by _createdIndex (original array position)
  if (property === '*') {
    return direction === 'asc'
      ? asc((item) => get(item, '_createdIndex'))
      : desc((item) => get(item, '_createdIndex'));
  }

  switch (type) {
    case 'string':
      return stringFunction(property, direction);
    case 'number':
      return numberFunction(property, direction);
    case 'date':
      return dateFunction(property, direction);
    case 'boolean':
      return booleanFunction(property, direction);
    default:
      // Default to string comparison
      return stringFunction(property, direction);
  }
};

/**
 * Creates a sort function that sorts a collection of items according to a set
 * of sort rules.
 *
 * @param sortRules - Array of sort rules to apply in order
 * @returns A function that takes items and returns sorted items
 *
 * @example
 * ```ts
 * // Sort by name ascending
 * const sorter = createCollectionSorter([
 *   { property: 'name', direction: 'asc', type: 'string' }
 * ]);
 * const sorted = sorter(users);
 *
 * // Sort by array order (newest first = LIFO)
 * const lifoSorter = createCollectionSorter([
 *   { property: '*', direction: 'desc', type: 'number' }
 * ]);
 *
 * // Sort by nested property
 * const nestedSorter = createCollectionSorter([
 *   { property: ['profile', 'displayName'], direction: 'asc', type: 'string' }
 * ]);
 *
 * // Multi-field sort
 * const multiSorter = createCollectionSorter([
 *   { property: 'lastName', direction: 'asc', type: 'string' },
 *   { property: 'firstName', direction: 'asc', type: 'string' },
 * ]);
 * ```
 */
const createCollectionSorter = <T extends Item = Item>(
  sortRules: SortRule[] = [],
) => {
  if (sortRules.length === 0) {
    // No sorting - return items unchanged
    return (items: T[]) => items;
  }

  const sortFunctions = sortRules.map(getSortFunction<T>);

  return (items: T[]) => {
    // Add _createdIndex for FIFO/LIFO sorting, then sort, then remove it
    return withoutCreatedIndex(
      withCreatedIndex(items).sort(chain(...sortFunctions)),
    );
  };
};

export default createCollectionSorter;
