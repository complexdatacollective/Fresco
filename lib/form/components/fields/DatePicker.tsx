'use client';

import { type InputHTMLAttributes } from 'react';
import { InputField } from './Input';

type DatePickerFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

export function DatePickerField(props: DatePickerFieldProps) {
  return <InputField type="date" {...props} />;
}
