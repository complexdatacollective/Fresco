import { range } from 'lodash-es';
import { useContext } from 'react';
import DatePickerContext from './DatePickerContext';
import { formatRangeItem } from './helpers';

/**
 * Supplies `years` range based on min/max props.
 */
const Years = ({ children }) => {
  const { range: dateRange } = useContext(DatePickerContext);
  const years = range(dateRange.start.year, dateRange.end.year + 1)
    .map((y) => formatRangeItem(y));
  return children({ years });
};

export default Years;
