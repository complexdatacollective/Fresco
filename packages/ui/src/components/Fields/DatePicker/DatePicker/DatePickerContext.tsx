import React from 'react';

export type DateDefinition = {
  year: number,
  month: number,
  day: number,
};

export type DatePickerContextType = {
  onChange: (date: Date) => void,
  range: {
    start: DateDefinition,
    end: DateDefinition,
  } | null,
  date: DateDefinition | null,
  type: string | null,
};

const DatePickerContext = React.createContext<DatePickerContextType>({
  onChange: () => {},
  range: null,
  date: null,
  type: null,
});

export default DatePickerContext;
