import React from 'react';

const DatePickerContext = React.createContext({
  onChange: () => {},
  range: null,
  date: {},
  type: null,
});

export default DatePickerContext;
