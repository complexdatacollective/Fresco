import { useContext } from 'react';
import DatePickerContext from './DatePickerContext';
import { formatRangeItem, rangeOfYears } from './helpers';

/**
 * Supplies `years` range based on min/max props.
 */

const Years = ({ children }) => {
  const { range } = useContext(DatePickerContext);

  if (!range) return null;

  const years = rangeOfYears(range.start.year, range.end.year + 1)
    .map((y) => formatRangeItem(y));
  return children({ years });
};

export default Years;
