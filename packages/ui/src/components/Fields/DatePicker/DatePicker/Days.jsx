import { useContext } from 'react';
import { range } from 'lodash';
import { DateTime } from 'luxon';
import DatePickerContext from './DatePickerContext';
import { formatRangeItem } from './helpers';

/**
 * Supplies `days` range based on currently selected month.
 */
const Days = ({ children }) => {
  const { date, range: dateRange } = useContext(DatePickerContext);

  const days = range(1, DateTime.fromObject(date).daysInMonth + 1)
    .map((day) => {
      const d = DateTime.fromObject({ ...date, day });
      if (dateRange.contains(d)) {
        return formatRangeItem(day);
      }
      return formatRangeItem(day, { isOutOfRange: true });
    });

  return children({ days });
};

export default Days;
