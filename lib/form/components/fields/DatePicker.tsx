'use client';

import { DatePicker, type DatePickerProps } from './DatePicker/DatePicker';

type DatePickerFieldProps = DatePickerProps;

export function DatePickerField(props: DatePickerFieldProps) {
  return <DatePicker {...props} />;
}
