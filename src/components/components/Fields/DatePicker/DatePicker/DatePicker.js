import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DateTime, Interval } from 'luxon';
import DatePickerContext from './DatePickerContext';
import { DATE_FORMATS, DEFAULT_TYPE, DEFAULT_MIN_DATE } from './config';
import { now, isComplete, isEmpty } from './helpers';

/**
 * Get date object from an ISO string
 */
const getDate = (dateString) => {
  const { year, month, day } = dateString
    ? DateTime.fromISO(dateString).toObject()
    : {
      month: null,
      day: null,
      year: null,
    };
  return { year, month, day };
};

const DatePicker = ({
  children,
  date,
  min,
  max,
  onChange,
  type,
}) => {
  const [pickerState, setPickerState] = useState({
    date: getDate(date),
  });

  // Correctly update component state when passed new date prop
  useEffect(() => {
    setPickerState((state) => ({
      ...state,
      date: getDate(date),
    }));
  }, [date]);

  const typeWithDefault = type || DEFAULT_TYPE;

  const format = DATE_FORMATS[typeWithDefault];

  const minWithDefault = min
    ? DateTime.fromISO(min)
    : now().minus(DEFAULT_MIN_DATE);

  const maxWithDefault = max
    ? DateTime.fromISO(max)
    : now();

  const range = Interval.fromDateTimes(minWithDefault.startOf('day'), maxWithDefault.endOf('day'));

  const handleOnChange = (values) => {
    const newDate = { ...pickerState.date, ...values };

    setPickerState((state) => ({
      ...state,
      date: newDate,
    }));

    if (isEmpty(type)(newDate)) {
      onChange('');
      return;
    }

    if (isComplete(type)(newDate)) {
      const dateString = DateTime.fromObject(newDate).toFormat(format);
      onChange(dateString);
    }
  };

  const context = {
    onChange: handleOnChange,
    range,
    type,
    ...pickerState,
  };

  return (
    <DatePickerContext.Provider value={context}>
      {children}
    </DatePickerContext.Provider>
  );
};

DatePicker.defaultProps = {
  children: null,
  type: DEFAULT_TYPE,
  date: null,
  min: null,
  max: null,
  onChange: () => {},
};

DatePicker.propTypes = {
  children: PropTypes.node,
  date: PropTypes.string,
  type: PropTypes.oneOf([...Object.keys(DATE_FORMATS)]),
  min: PropTypes.string,
  max: PropTypes.string,
  onChange: PropTypes.func,
};

export default DatePicker;
