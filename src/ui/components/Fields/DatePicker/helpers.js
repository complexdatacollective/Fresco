import { DateTime, Info } from 'luxon';
import {
  difference,
  intersection,
  isEqual,
  get,
} from 'lodash';

export const now = () => DateTime.local();

export const getFirstDayOfMonth = (dateObj) => DateTime.fromObject({ ...dateObj, day: 1 }).toFormat('c');

export const asNullObject = (keys) => keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});

export const getProperties = (obj) => Object.keys(obj)
  .reduce((acc, key) => {
    if (!obj[key]) { return acc; }
    return [...acc, key];
  }, []);

export const hasProperties = (includes = [], excludes = []) => (obj) => {
  const props = getProperties(obj);
  const hasIncludes = difference(includes, props).length === 0;
  const noExcludes = intersection(props, excludes).length === 0;
  return hasIncludes && noExcludes;
};

export const getMonthName = (numericMonth) => get(Info.months(), numericMonth - 1, numericMonth);

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

export const isEmpty = () => (date) => isEqual(date, { year: null, month: null, day: null });

export const formatRangeItem = (value, props = {}) => ({
  value,
  label: value,
  ...props,
});
