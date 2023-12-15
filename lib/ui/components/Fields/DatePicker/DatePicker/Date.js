import { useContext } from 'react';
import DatePickerContext from './DatePickerContext';
import { isComplete, isEmpty } from './helpers';

const Date = ({ children }) => {
  const {
    onChange, date, range, type,
  } = useContext(DatePickerContext);

  return children({
    onChange,
    date,
    range,
    type,
    isComplete: isComplete(type)(date),
    isEmpty: isEmpty(type)(date),
  });
};

export default Date;
