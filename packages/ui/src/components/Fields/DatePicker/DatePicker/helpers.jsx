/* eslint-disable import/prefer-default-export */

import { DateTime, Info } from 'luxon';
import { get } from '@codaco/utils';

export const now = () => DateTime.local();

/**
 * Is date object fully complete?
 */
export const isComplete = (type) => ({ day, month, year }) => {
  switch (type) {
    case 'year':
      return !!year;
    case 'month':
      return !!year && !!month;
    default:
      return !!year && !!month && !!day;
  }
};

/**
 * Is date object empty
 */

// Empty if all values are null
export const isEmpty = () => (date) => {
  const dateObject = DateTime.fromISO(date).toObject();

  // { year: null, month: null, day: null }
  // Return true if all values are null
  return Object.values(dateObject).every((value) => value === null);
};

export const getMonthName = (numericMonth) => get(Info.months(), numericMonth - 1, numericMonth);

export const formatRangeItem = (value, props = {}) => ({
  value,
  label: value,
  ...props,
});

// Replacement for lodash.range. Returns an array of numbers from `start` to `end`.
export const rangeOfYears = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);
