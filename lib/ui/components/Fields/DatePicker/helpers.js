import { difference, get, intersection } from 'lodash-es';
import { DateTime, Info } from 'luxon';

export const now = () => DateTime.local();

export const isEmpty = (value) => value === null || value === '';

export const getFirstDayOfMonth = (dateObj) => DateTime.fromObject({ ...dateObj, day: 1 }).toFormat('c');

const getProperties = (obj) => Object.keys(obj)
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
