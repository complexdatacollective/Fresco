/* eslint-disable import/prefer-default-export */

import { DateTime, Info } from 'luxon';
import { isEqual, get } from 'lodash';

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
export const isEmpty = () => (date) => isEqual(date, { year: null, month: null, day: null });

export const getMonthName = (numericMonth) => get(Info.months(), numericMonth - 1, numericMonth);

export const formatRangeItem = (value, props = {}) => ({
  value,
  label: value,
  ...props,
});
