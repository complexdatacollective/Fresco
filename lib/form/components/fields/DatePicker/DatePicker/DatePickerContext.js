import React from 'react';

const DatePickerContext = React.createContext({
  onChange: () => undefined,
  range: null,
  date: {},
  type: null,
});

export default DatePickerContext;
