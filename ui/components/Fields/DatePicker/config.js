/* eslint-disable import/prefer-default-export */

export const DEFAULT_MIN_DATE = { years: 100 }; // DateTime.minus(DEFAULT_MIN_DATE);

export const DEFAULT_TYPE = 'full';

export const DATE_FORMATS = {
  full: 'yyyy-MM-dd',
  month: 'yyyy-MM',
  year: 'yyyy',
};

export const DATE_TYPES = [
  {
    label: 'Full',
    value: 'full',
  },
  {
    label: 'Month',
    value: 'month',
  },
  {
    label: 'Year',
    value: 'year',
  },
];
